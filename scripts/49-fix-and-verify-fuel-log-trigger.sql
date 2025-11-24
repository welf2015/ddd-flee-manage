-- Fix and verify fuel log trigger is working correctly
-- This ensures fuel logs are created when drivers are assigned with fuel expenses

-- Step 1: Recreate the trigger function with the updated logic
CREATE OR REPLACE FUNCTION create_fuel_log_from_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_fuel_log_id UUID;
  v_vehicle_fuel_type TEXT;
  v_vendor_name TEXT;
BEGIN
  -- Only process Fuel type transactions with vehicle_id
  -- Create log if amount > 0 OR if quantity is provided (for accounting entries)
  IF NEW.expense_type = 'Fuel' AND NEW.vehicle_id IS NOT NULL AND (NEW.amount > 0 OR NEW.quantity IS NOT NULL) THEN
    -- Get vehicle fuel type
    SELECT fuel_type INTO v_vehicle_fuel_type
    FROM vehicles
    WHERE id = NEW.vehicle_id;
    
    -- Get vendor name
    SELECT ev.vendor_name INTO v_vendor_name
    FROM expense_vendors ev
    JOIN prepaid_accounts pa ON pa.vendor_id = ev.id
    WHERE pa.id = NEW.account_id;
    
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
    )
    SELECT
      NEW.vehicle_id,
      NEW.driver_id,
      NEW.booking_id,
      COALESCE(v_vehicle_fuel_type, 'Diesel'),
      COALESCE(NEW.quantity, 0),
      COALESCE(NEW.unit, 'Liters'),
      NEW.amount,
      COALESCE(v_vendor_name, 'Total Energies'),
      COALESCE(NEW.transaction_date, NOW()),
      NEW.id
    WHERE NOT EXISTS (
      SELECT 1 FROM fuel_logs WHERE expense_transaction_id = NEW.id
    )
    RETURNING id INTO v_fuel_log_id;
    
    -- Log success (for debugging)
    RAISE NOTICE 'Fuel log created: transaction_id=%, fuel_log_id=%, amount=%, quantity=%', 
      NEW.id, v_fuel_log_id, NEW.amount, NEW.quantity;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Error creating fuel log for transaction %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Drop and recreate trigger to ensure it's enabled
DROP TRIGGER IF EXISTS trigger_auto_create_fuel_log ON expense_transactions;
CREATE TRIGGER trigger_auto_create_fuel_log
  AFTER INSERT ON expense_transactions
  FOR EACH ROW
  WHEN (NEW.expense_type = 'Fuel')
  EXECUTE FUNCTION create_fuel_log_from_transaction();

-- Step 3: Enable trigger explicitly
ALTER TABLE expense_transactions ENABLE ALWAYS TRIGGER trigger_auto_create_fuel_log;

-- Step 4: Verify trigger is enabled
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  CASE tgenabled
    WHEN 'O' THEN 'Disabled (Origin)'
    WHEN 'A' THEN 'Enabled (Always)'
    WHEN 'R' THEN 'Disabled (Replica)'
    WHEN 'D' THEN 'Disabled'
    ELSE 'Unknown'
  END as status
FROM pg_trigger
WHERE tgname = 'trigger_auto_create_fuel_log';

-- Step 5: Check recent fuel transactions that should have logs
SELECT 
  et.id as transaction_id,
  et.amount,
  et.quantity,
  et.vehicle_id,
  et.transaction_date,
  v.vehicle_number,
  fl.id as fuel_log_id,
  CASE 
    WHEN fl.id IS NOT NULL THEN '✅ Log exists'
    WHEN et.amount > 0 OR et.quantity IS NOT NULL THEN '❌ Log missing - trigger may have failed'
    ELSE '⚠️ No log expected (amount=0 and no quantity)'
  END as status
FROM expense_transactions et
LEFT JOIN vehicles v ON et.vehicle_id = v.id
LEFT JOIN fuel_logs fl ON fl.expense_transaction_id = et.id
WHERE et.expense_type = 'Fuel'
ORDER BY et.transaction_date DESC
LIMIT 10;

-- Step 6: Manually create fuel logs for any missing ones (backfill)
DO $$
DECLARE
  transaction_record RECORD;
  v_fuel_log_id UUID;
  v_vehicle_fuel_type TEXT;
  v_vendor_name TEXT;
BEGIN
  FOR transaction_record IN
    SELECT 
      et.id,
      et.vehicle_id,
      et.driver_id,
      et.booking_id,
      et.amount,
      et.quantity,
      et.unit,
      et.transaction_date,
      et.account_id
    FROM expense_transactions et
    WHERE et.expense_type = 'Fuel'
      AND et.vehicle_id IS NOT NULL
      AND (et.amount > 0 OR et.quantity IS NOT NULL)
      AND NOT EXISTS (
        SELECT 1 FROM fuel_logs WHERE expense_transaction_id = et.id
      )
  LOOP
    -- Get vehicle fuel type
    SELECT fuel_type INTO v_vehicle_fuel_type
    FROM vehicles
    WHERE id = transaction_record.vehicle_id;
    
    -- Get vendor name
    SELECT ev.vendor_name INTO v_vendor_name
    FROM expense_vendors ev
    JOIN prepaid_accounts pa ON pa.vendor_id = ev.id
    WHERE pa.id = transaction_record.account_id;
    
    -- Create fuel log
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
    )
    VALUES (
      transaction_record.vehicle_id,
      transaction_record.driver_id,
      transaction_record.booking_id,
      COALESCE(v_vehicle_fuel_type, 'Diesel'),
      COALESCE(transaction_record.quantity, 0),
      COALESCE(transaction_record.unit, 'Liters'),
      transaction_record.amount,
      COALESCE(v_vendor_name, 'Total Energies'),
      COALESCE(transaction_record.transaction_date, NOW()),
      transaction_record.id
    )
    RETURNING id INTO v_fuel_log_id;
    
    RAISE NOTICE 'Created missing fuel log: transaction_id=%, fuel_log_id=%', 
      transaction_record.id, v_fuel_log_id;
  END LOOP;
END $$;
