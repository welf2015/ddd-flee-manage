-- Validate all prepaid account balances using dynamic calculation
-- This script compares stored values with calculated values for audit purposes

-- First, let's create a summary of all accounts with both stored and calculated balances
SELECT 
  pa.id,
  pa.account_name,
  pa.current_balance as stored_balance,
  COALESCE(SUM(CASE WHEN at.topup_type IN ('TOPUP', 'REFUND', 'ADJUSTMENT') THEN at.amount ELSE 0 END), 0) as calculated_deposits,
  COALESCE(SUM(CASE WHEN et.expense_type IS NOT NULL THEN et.amount ELSE 0 END), 0) as calculated_spent,
  COALESCE(SUM(CASE WHEN at.topup_type IN ('TOPUP', 'REFUND', 'ADJUSTMENT') THEN at.amount ELSE 0 END), 0) - 
  COALESCE(SUM(CASE WHEN et.expense_type IS NOT NULL THEN et.amount ELSE 0 END), 0) as calculated_balance,
  CASE 
    WHEN pa.current_balance = (COALESCE(SUM(CASE WHEN at.topup_type IN ('TOPUP', 'REFUND', 'ADJUSTMENT') THEN at.amount ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN et.expense_type IS NOT NULL THEN et.amount ELSE 0 END), 0))
    THEN '✅ MATCH'
    ELSE '❌ MISMATCH'
  END as status
FROM prepaid_accounts pa
LEFT JOIN account_topups at ON pa.id = at.account_id
LEFT JOIN expense_transactions et ON pa.id = et.account_id
GROUP BY pa.id, pa.account_name, pa.current_balance
ORDER BY pa.account_name;

-- Show recent transactions and adjustments to verify data integrity
SELECT 
  'TOPUP' as type,
  pa.account_name,
  at.amount,
  at.topup_type,
  at.created_at
FROM account_topups at
LEFT JOIN prepaid_accounts pa ON at.account_id = pa.id
WHERE at.created_at >= NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
  'EXPENSE' as type,
  pa.account_name,
  et.amount,
  et.expense_type,
  et.transaction_date
FROM expense_transactions et
LEFT JOIN prepaid_accounts pa ON et.account_id = pa.id
WHERE et.transaction_date >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC, transaction_date DESC;
