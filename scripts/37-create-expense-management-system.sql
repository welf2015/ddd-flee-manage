-- Expense Management System Migration
-- Creates prepaid expense accounts for Fuel, Ticketing, and Allowances

-- 1. Expense Vendors Table
CREATE TABLE IF NOT EXISTS expense_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name TEXT NOT NULL,
  vendor_type TEXT NOT NULL CHECK (vendor_type IN ('Fuel', 'Ticketing', 'Allowance')),
  contact_person TEXT,
  contact_phone TEXT,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Prepaid Accounts Table
CREATE TABLE IF NOT EXISTS prepaid_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES expense_vendors(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  current_balance DECIMAL(12, 2) DEFAULT 0,
  total_deposited DECIMAL(12, 2) DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Account Top-ups/Deposits Table
CREATE TABLE IF NOT EXISTS account_topups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES prepaid_accounts(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  topup_date TIMESTAMPTZ DEFAULT NOW(),
  receipt_number TEXT,
  receipt_url TEXT,
  deposited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Expense Transactions Table
CREATE TABLE IF NOT EXISTS expense_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES prepaid_accounts(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  expense_type TEXT NOT NULL CHECK (expense_type IN ('Fuel', 'Ticketing', 'Allowance')),
  amount DECIMAL(12, 2) NOT NULL,
  quantity DECIMAL(10, 2), -- liters for fuel
  unit TEXT CHECK (unit IN ('Liters', 'kWh', 'N/A')),
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Update fuel_logs table to link to expense transactions
ALTER TABLE fuel_logs 
ADD COLUMN IF NOT EXISTS expense_transaction_id UUID REFERENCES expense_transactions(id) ON DELETE SET NULL;

-- 6. Update bookings table to track expense amounts
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS fuel_amount DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS ticketing_amount DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS allowance_amount DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS fuel_account_id UUID REFERENCES prepaid_accounts(id),
ADD COLUMN IF NOT EXISTS ticketing_account_id UUID REFERENCES prepaid_accounts(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prepaid_accounts_vendor ON prepaid_accounts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_account_topups_account ON account_topups(account_id);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_account ON expense_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_booking ON expense_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_driver ON expense_transactions(driver_id);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_vehicle ON expense_transactions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_expense_transactions_type ON expense_transactions(expense_type);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_expense_transaction ON fuel_logs(expense_transaction_id);

-- Enable RLS
ALTER TABLE expense_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE prepaid_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_topups ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expense_vendors
CREATE POLICY "Allow authenticated users to read expense vendors" ON expense_vendors
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert expense vendors" ON expense_vendors
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update expense vendors" ON expense_vendors
  FOR UPDATE TO authenticated USING (true);

-- RLS Policies for prepaid_accounts
CREATE POLICY "Allow authenticated users to read prepaid accounts" ON prepaid_accounts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert prepaid accounts" ON prepaid_accounts
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update prepaid accounts" ON prepaid_accounts
  FOR UPDATE TO authenticated USING (true);

-- RLS Policies for account_topups
CREATE POLICY "Allow authenticated users to read account topups" ON account_topups
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert account topups" ON account_topups
  FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for expense_transactions
CREATE POLICY "Allow authenticated users to read expense transactions" ON expense_transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert expense transactions" ON expense_transactions
  FOR INSERT TO authenticated WITH CHECK (true);

-- Function to update account balance on top-up
CREATE OR REPLACE FUNCTION update_account_balance_on_topup()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE prepaid_accounts
  SET 
    current_balance = current_balance + NEW.amount,
    total_deposited = total_deposited + NEW.amount,
    updated_at = NOW()
  WHERE id = NEW.account_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update account balance on top-up
CREATE TRIGGER trigger_update_account_balance_on_topup
  AFTER INSERT ON account_topups
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance_on_topup();

-- Function to deduct account balance on transaction
CREATE OR REPLACE FUNCTION deduct_account_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE prepaid_accounts
  SET 
    current_balance = current_balance - NEW.amount,
    total_spent = total_spent + NEW.amount,
    updated_at = NOW()
  WHERE id = NEW.account_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to deduct account balance on transaction
CREATE TRIGGER trigger_deduct_account_balance_on_transaction
  AFTER INSERT ON expense_transactions
  FOR EACH ROW
  EXECUTE FUNCTION deduct_account_balance_on_transaction();

-- Function to auto-create fuel log from fuel expense transaction
CREATE OR REPLACE FUNCTION create_fuel_log_from_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_fuel_log_id UUID;
  v_vehicle_fuel_type TEXT;
BEGIN
  -- Only process Fuel type transactions
  IF NEW.expense_type = 'Fuel' AND NEW.vehicle_id IS NOT NULL THEN
    -- Get vehicle fuel type
    SELECT fuel_type INTO v_vehicle_fuel_type
    FROM vehicles
    WHERE id = NEW.vehicle_id;
    
    -- Create fuel log entry
    INSERT INTO fuel_logs (
      vehicle_id,
      driver_id,
      booking_id,
      fuel_type,
      quantity,
      unit,
      cost,
      station_name,
      logged_at,
      expense_transaction_id
    ) VALUES (
      NEW.vehicle_id,
      NEW.driver_id,
      NEW.booking_id,
      COALESCE(v_vehicle_fuel_type, 'Diesel'),
      NEW.quantity,
      COALESCE(NEW.unit, 'Liters'),
      NEW.amount,
      (SELECT vendor_name FROM expense_vendors WHERE id = (SELECT vendor_id FROM prepaid_accounts WHERE id = NEW.account_id)),
      NEW.transaction_date,
      NEW.id
    )
    RETURNING id INTO v_fuel_log_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create fuel log on fuel transaction
CREATE TRIGGER trigger_auto_create_fuel_log
  AFTER INSERT ON expense_transactions
  FOR EACH ROW
  WHEN (NEW.expense_type = 'Fuel')
  EXECUTE FUNCTION create_fuel_log_from_transaction();

-- Insert default vendors
INSERT INTO expense_vendors (vendor_name, vendor_type, is_active) VALUES
  ('Total Energies', 'Fuel', true),
  ('Nigerian Ports Authority', 'Ticketing', true),
  ('Driver Allowance Pool', 'Allowance', true)
ON CONFLICT DO NOTHING;

-- Create default prepaid accounts for each vendor
DO $$
DECLARE
  v_fuel_vendor_id UUID;
  v_ticketing_vendor_id UUID;
  v_allowance_vendor_id UUID;
BEGIN
  -- Get vendor IDs
  SELECT id INTO v_fuel_vendor_id FROM expense_vendors WHERE vendor_name = 'Total Energies' LIMIT 1;
  SELECT id INTO v_ticketing_vendor_id FROM expense_vendors WHERE vendor_name = 'Nigerian Ports Authority' LIMIT 1;
  SELECT id INTO v_allowance_vendor_id FROM expense_vendors WHERE vendor_name = 'Driver Allowance Pool' LIMIT 1;
  
  -- Create default accounts if they don't exist
  IF v_fuel_vendor_id IS NOT NULL THEN
    INSERT INTO prepaid_accounts (vendor_id, account_name, current_balance, is_active)
    VALUES (v_fuel_vendor_id, 'Total Energies - Main Account', 0, true)
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF v_ticketing_vendor_id IS NOT NULL THEN
    INSERT INTO prepaid_accounts (vendor_id, account_name, current_balance, is_active)
    VALUES (v_ticketing_vendor_id, 'Nigerian Ports Authority - Main Account', 0, true)
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF v_allowance_vendor_id IS NOT NULL THEN
    INSERT INTO prepaid_accounts (vendor_id, account_name, current_balance, is_active)
    VALUES (v_allowance_vendor_id, 'Driver Allowance Pool - Main Account', 0, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

