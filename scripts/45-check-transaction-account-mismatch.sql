-- Check for transactions assigned to wrong accounts
-- This will identify any data integrity issues

-- Check transactions with account/vendor type mismatches
SELECT 
  et.id,
  et.transaction_date,
  et.expense_type,
  et.amount,
  pa.account_name,
  ev.vendor_type as account_vendor_type,
  CASE 
    WHEN et.expense_type = 'Fuel' AND ev.vendor_type != 'Fuel' THEN '❌ Wrong Account'
    WHEN et.expense_type = 'Ticketing' AND ev.vendor_type != 'Ticketing' THEN '❌ Wrong Account'
    WHEN et.expense_type = 'Allowance' AND ev.vendor_type != 'Allowance' THEN '❌ Wrong Account'
    ELSE '✅ Correct'
  END as status
FROM expense_transactions et
LEFT JOIN prepaid_accounts pa ON et.account_id = pa.id
LEFT JOIN expense_vendors ev ON pa.vendor_id = ev.id
ORDER BY et.transaction_date DESC;

-- Show current account balances with transaction summary
SELECT 
  pa.account_name,
  ev.vendor_type,
  pa.current_balance,
  pa.total_deposited,
  pa.total_spent,
  COUNT(DISTINCT at.id) as topup_count,
  COUNT(DISTINCT et.id) as transaction_count,
  COALESCE(SUM(at.amount), 0) as sum_topups,
  COALESCE(SUM(et.amount), 0) as sum_transactions,
  (COALESCE(SUM(at.amount), 0) - COALESCE(SUM(et.amount), 0)) as calculated_balance
FROM prepaid_accounts pa
LEFT JOIN expense_vendors ev ON pa.vendor_id = ev.id
LEFT JOIN account_topups at ON pa.id = at.account_id
LEFT JOIN expense_transactions et ON pa.id = et.account_id
GROUP BY pa.id, pa.account_name, ev.vendor_type, pa.current_balance, pa.total_deposited, pa.total_spent
ORDER BY ev.vendor_type, pa.account_name;

-- Check if there are any transactions that should be moved to correct accounts
SELECT 
  et.id,
  et.expense_type,
  et.amount,
  et.transaction_date,
  pa.account_name as current_account,
  ev.vendor_type as current_account_type,
  correct_account.id as correct_account_id,
  correct_account.account_name as correct_account_name
FROM expense_transactions et
LEFT JOIN prepaid_accounts pa ON et.account_id = pa.id
LEFT JOIN expense_vendors ev ON pa.vendor_id = ev.id
LEFT JOIN expense_vendors correct_vendor ON 
  (et.expense_type = 'Fuel' AND correct_vendor.vendor_type = 'Fuel') OR
  (et.expense_type = 'Ticketing' AND correct_vendor.vendor_type = 'Ticketing') OR
  (et.expense_type = 'Allowance' AND correct_vendor.vendor_type = 'Allowance')
LEFT JOIN prepaid_accounts correct_account ON correct_account.vendor_id = correct_vendor.id
WHERE 
  (et.expense_type = 'Fuel' AND ev.vendor_type != 'Fuel') OR
  (et.expense_type = 'Ticketing' AND ev.vendor_type != 'Ticketing') OR
  (et.expense_type = 'Allowance' AND ev.vendor_type != 'Allowance')
ORDER BY et.transaction_date DESC;
