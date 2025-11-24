-- Script to verify account balances and top-ups
-- Run this in Supabase SQL Editor to check if balances are updating correctly

-- Check prepaid accounts with balances
SELECT 
  pa.id,
  pa.account_name,
  pa.current_balance,
  pa.total_deposited,
  pa.total_spent,
  ev.vendor_name,
  ev.vendor_type,
  pa.is_active,
  pa.created_at,
  pa.updated_at
FROM prepaid_accounts pa
LEFT JOIN expense_vendors ev ON pa.vendor_id = ev.id
ORDER BY pa.account_name;

-- Check recent top-ups
SELECT 
  at.id,
  at.account_id,
  pa.account_name,
  at.amount,
  at.topup_date,
  p.full_name as deposited_by,
  at.receipt_number,
  at.notes
FROM account_topups at
LEFT JOIN prepaid_accounts pa ON at.account_id = pa.id
LEFT JOIN profiles p ON at.deposited_by = p.id
ORDER BY at.topup_date DESC
LIMIT 20;

-- Check if triggers are working - compare manual calculation vs stored values
SELECT 
  pa.account_name,
  pa.current_balance as stored_balance,
  pa.total_deposited as stored_deposited,
  pa.total_spent as stored_spent,
  COALESCE(SUM(at.amount), 0) as calculated_deposited,
  COALESCE(SUM(et.amount), 0) as calculated_spent,
  COALESCE(SUM(at.amount), 0) - COALESCE(SUM(et.amount), 0) as calculated_balance,
  CASE 
    WHEN pa.current_balance != (COALESCE(SUM(at.amount), 0) - COALESCE(SUM(et.amount), 0)) 
    THEN 'MISMATCH' 
    ELSE 'OK' 
  END as status
FROM prepaid_accounts pa
LEFT JOIN account_topups at ON pa.id = at.account_id
LEFT JOIN expense_transactions et ON pa.id = et.account_id
GROUP BY pa.id, pa.account_name, pa.current_balance, pa.total_deposited, pa.total_spent
ORDER BY pa.account_name;

-- Check trigger functions exist
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname IN (
  'update_account_balance_on_topup',
  'deduct_account_balance_on_transaction'
);

-- Check triggers exist
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname IN (
  'trigger_update_account_balance_on_topup',
  'trigger_deduct_account_balance_on_transaction'
);
