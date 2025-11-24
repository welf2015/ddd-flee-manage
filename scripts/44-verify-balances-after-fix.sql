-- Verify that balances are now correct after enabling triggers
-- Run this after running script 42 to confirm everything is working

-- Check account balances
SELECT 
  pa.account_name,
  ev.vendor_type,
  pa.current_balance,
  pa.total_deposited,
  pa.total_spent,
  CASE 
    WHEN pa.current_balance < 0 THEN '⚠️ Overdrawn'
    WHEN pa.current_balance = 0 THEN '⚪ Zero'
    ELSE '✅ Positive'
  END as status
FROM prepaid_accounts pa
LEFT JOIN expense_vendors ev ON pa.vendor_id = ev.id
ORDER BY ev.vendor_type, pa.account_name;

-- Verify balance calculations match stored values
SELECT 
  pa.account_name,
  pa.current_balance as stored_balance,
  pa.total_deposited as stored_deposited,
  pa.total_spent as stored_spent,
  COALESCE(SUM(at.amount), 0) as calculated_deposited,
  COALESCE(SUM(et.amount), 0) as calculated_spent,
  (COALESCE(SUM(at.amount), 0) - COALESCE(SUM(et.amount), 0)) as calculated_balance,
  CASE 
    WHEN pa.current_balance = (COALESCE(SUM(at.amount), 0) - COALESCE(SUM(et.amount), 0)) 
    THEN '✅ Match'
    ELSE '❌ Mismatch'
  END as verification
FROM prepaid_accounts pa
LEFT JOIN account_topups at ON pa.id = at.account_id
LEFT JOIN expense_transactions et ON pa.id = et.account_id
GROUP BY pa.id, pa.account_name, pa.current_balance, pa.total_deposited, pa.total_spent
ORDER BY pa.account_name;

-- Show recent top-ups
SELECT 
  at.id,
  pa.account_name,
  at.amount,
  at.topup_date,
  p.full_name as deposited_by
FROM account_topups at
LEFT JOIN prepaid_accounts pa ON at.account_id = pa.id
LEFT JOIN profiles p ON at.deposited_by = p.id
ORDER BY at.topup_date DESC
LIMIT 10;

-- Show recent transactions
SELECT 
  et.id,
  pa.account_name,
  et.amount,
  et.expense_type,
  et.transaction_date,
  b.job_id
FROM expense_transactions et
LEFT JOIN prepaid_accounts pa ON et.account_id = pa.id
LEFT JOIN bookings b ON et.booking_id = b.id
ORDER BY et.transaction_date DESC
LIMIT 10;
