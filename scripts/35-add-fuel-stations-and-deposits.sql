-- Create fuel_stations table for tracking prepaid fuel deposits
CREATE TABLE IF NOT EXISTS fuel_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_name TEXT NOT NULL,
  location TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  deposit_balance DECIMAL(12, 2) DEFAULT 0,
  total_deposited DECIMAL(12, 2) DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add station_id reference to fuel_logs
ALTER TABLE fuel_logs 
ADD COLUMN IF NOT EXISTS station_id UUID REFERENCES fuel_stations(id);

-- Create fuel_deposits table for tracking deposit transactions
CREATE TABLE IF NOT EXISTS fuel_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES fuel_stations(id),
  amount DECIMAL(12, 2) NOT NULL,
  deposited_by UUID REFERENCES auth.users(id),
  deposit_date TIMESTAMPTZ DEFAULT NOW(),
  receipt_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_fuel_logs_station_id ON fuel_logs(station_id);
CREATE INDEX IF NOT EXISTS idx_fuel_deposits_station_id ON fuel_deposits(station_id);

-- Add RLS policies
ALTER TABLE fuel_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read fuel stations" ON fuel_stations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert fuel stations" ON fuel_stations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update fuel stations" ON fuel_stations
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read fuel deposits" ON fuel_deposits
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert fuel deposits" ON fuel_deposits
  FOR INSERT TO authenticated WITH CHECK (true);

-- Create trigger to update fuel station balance when deposits are made
CREATE OR REPLACE FUNCTION update_station_balance_on_deposit()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE fuel_stations
  SET 
    deposit_balance = deposit_balance + NEW.amount,
    total_deposited = total_deposited + NEW.amount,
    updated_at = NOW()
  WHERE id = NEW.station_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_station_balance_on_deposit
  AFTER INSERT ON fuel_deposits
  FOR EACH ROW
  EXECUTE FUNCTION update_station_balance_on_deposit();

-- Create trigger to update fuel station balance when fuel is logged
CREATE OR REPLACE FUNCTION update_station_balance_on_fuel_log()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.station_id IS NOT NULL THEN
    UPDATE fuel_stations
    SET 
      deposit_balance = deposit_balance - NEW.cost,
      total_spent = total_spent + NEW.cost,
      updated_at = NOW()
    WHERE id = NEW.station_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_station_balance_on_fuel_log
  AFTER INSERT ON fuel_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_station_balance_on_fuel_log();
