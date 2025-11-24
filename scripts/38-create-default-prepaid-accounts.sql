-- Create default prepaid accounts for each vendor
-- This script ensures the default accounts exist even if migration 37 didn't create them

DO $$
DECLARE
  v_fuel_vendor_id UUID;
  v_ticketing_vendor_id UUID;
  v_allowance_vendor_id UUID;
  v_fuel_account_exists BOOLEAN;
  v_ticketing_account_exists BOOLEAN;
  v_allowance_account_exists BOOLEAN;
BEGIN
  -- Get vendor IDs
  SELECT id INTO v_fuel_vendor_id FROM expense_vendors WHERE vendor_name = 'Total Energies' LIMIT 1;
  SELECT id INTO v_ticketing_vendor_id FROM expense_vendors WHERE vendor_name = 'Nigerian Ports Authority' LIMIT 1;
  SELECT id INTO v_allowance_vendor_id FROM expense_vendors WHERE vendor_name = 'Driver Allowance Pool' LIMIT 1;
  
  -- Check if accounts already exist
  IF v_fuel_vendor_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM prepaid_accounts WHERE vendor_id = v_fuel_vendor_id) INTO v_fuel_account_exists;
    IF NOT v_fuel_account_exists THEN
      INSERT INTO prepaid_accounts (vendor_id, account_name, current_balance, total_deposited, total_spent, is_active)
      VALUES (v_fuel_vendor_id, 'Total Energies - Main Account', 0, 0, 0, true);
    END IF;
  END IF;
  
  IF v_ticketing_vendor_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM prepaid_accounts WHERE vendor_id = v_ticketing_vendor_id) INTO v_ticketing_account_exists;
    IF NOT v_ticketing_account_exists THEN
      INSERT INTO prepaid_accounts (vendor_id, account_name, current_balance, total_deposited, total_spent, is_active)
      VALUES (v_ticketing_vendor_id, 'Nigerian Ports Authority - Main Account', 0, 0, 0, true);
    END IF;
  END IF;
  
  IF v_allowance_vendor_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM prepaid_accounts WHERE vendor_id = v_allowance_vendor_id) INTO v_allowance_account_exists;
    IF NOT v_allowance_account_exists THEN
      INSERT INTO prepaid_accounts (vendor_id, account_name, current_balance, total_deposited, total_spent, is_active)
      VALUES (v_allowance_vendor_id, 'Driver Allowance Pool - Main Account', 0, 0, 0, true);
    END IF;
  END IF;
END $$;
