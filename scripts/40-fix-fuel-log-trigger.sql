-- Fix fuel log trigger to always create logs when amount > 0
-- The previous condition was too strict

CREATE OR REPLACE FUNCTION create_fuel_log_from_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_fuel_log_id UUID;
  v_vehicle_fuel_type TEXT;
  v_vendor_name TEXT;
BEGIN
  -- Only process Fuel type transactions with vehicle_id
  IF NEW.expense_type = 'Fuel' AND NEW.vehicle_id IS NOT NULL AND NEW.amount > 0 THEN
    -- Get vehicle fuel type
    SELECT fuel_type INTO v_vehicle_fuel_type
    FROM vehicles
    WHERE id = NEW.vehicle_id;
    
    -- Get vendor name
    SELECT ev.vendor_name INTO v_vendor_name
    FROM expense_vendors ev
    JOIN prepaid_accounts pa ON pa.vendor_id = ev.id
    WHERE pa.id = NEW.account_id;
    
    -- Create fuel log entry (always create if amount > 0)
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
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Error creating fuel log: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

