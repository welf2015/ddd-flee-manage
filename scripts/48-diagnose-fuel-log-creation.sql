-- Diagnose why fuel logs aren't being created
-- Check transactions, trigger status, and fuel logs

-- 1. Check recent fuel transactions
SELECT 
  et.id,
  et.expense_type,
  et.amount,
  et.quantity,
  et.vehicle_id,
  et.driver_id,
  et.booking_id,
  et.transaction_date,
  v.vehicle_number,
  d.full_name as driver_name,
  b.job_id,
  CASE 
    WHEN et.amount > 0 AND et.vehicle_id IS NOT NULL THEN '✅ Should create log'
    WHEN et.amount = 0 THEN '⚠️ Amount is 0'
    WHEN et.vehicle_id IS NULL THEN '⚠️ No vehicle_id'
    ELSE '❌ Missing data'
  END as status
FROM expense_transactions et
LEFT JOIN vehicles v ON et.vehicle_id = v.id
LEFT JOIN drivers d ON et.driver_id = d.id
LEFT JOIN bookings b ON et.booking_id = b.id
WHERE et.expense_type = 'Fuel'
ORDER BY et.transaction_date DESC
LIMIT 10;

-- 2. Check if fuel logs exist for these transactions
SELECT 
  et.id as transaction_id,
  et.amount as transaction_amount,
  et.quantity as transaction_quantity,
  fl.id as fuel_log_id,
  fl.quantity as fuel_log_quantity,
  fl.cost as fuel_log_cost,
  fl.station_name,
  CASE 
    WHEN fl.id IS NULL THEN '❌ No fuel log created'
    ELSE '✅ Fuel log exists'
  END as status
FROM expense_transactions et
LEFT JOIN fuel_logs fl ON fl.expense_transaction_id = et.id
WHERE et.expense_type = 'Fuel'
ORDER BY et.transaction_date DESC
LIMIT 10;

-- 3. Check trigger status
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  CASE tgenabled
    WHEN 'O' THEN 'Disabled (Origin)'
    WHEN 'A' THEN 'Enabled (Always)'
    WHEN 'R' THEN 'Disabled (Replica)'
    WHEN 'D' THEN 'Disabled'
    ELSE 'Unknown'
  END as status,
  tgenabled as enabled_code
FROM pg_trigger
WHERE tgname = 'trigger_auto_create_fuel_log';

-- 4. Check trigger function exists
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname = 'create_fuel_log_from_transaction';

-- 5. Check all fuel logs (recent)
SELECT 
  fl.id,
  fl.vehicle_id,
  fl.driver_id,
  fl.booking_id,
  fl.fuel_type,
  fl.quantity,
  fl.unit,
  fl.cost,
  fl.station_name,
  fl.logged_at,
  fl.expense_transaction_id,
  v.vehicle_number,
  d.full_name as driver_name,
  b.job_id
FROM fuel_logs fl
LEFT JOIN vehicles v ON fl.vehicle_id = v.id
LEFT JOIN drivers d ON fl.driver_id = d.id
LEFT JOIN bookings b ON fl.booking_id = b.id
ORDER BY fl.logged_at DESC
LIMIT 10;

-- 6. Check for trigger errors (if PostgreSQL logs are accessible)
-- This would need to be checked in PostgreSQL logs
-- But we can check if there are any fuel logs with expense_transaction_id
SELECT 
  COUNT(*) as total_fuel_logs,
  COUNT(expense_transaction_id) as logs_with_transaction_id,
  COUNT(*) - COUNT(expense_transaction_id) as logs_without_transaction_id
FROM fuel_logs;
