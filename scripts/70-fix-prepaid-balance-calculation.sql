-- Create a function to calculate correct prepaid account balances
-- This avoids JOIN multiplication issues and calculates dynamically
CREATE OR REPLACE FUNCTION calculate_account_balance(account_id uuid)
RETURNS TABLE (
  total_deposited NUMERIC,
  total_spent NUMERIC,
  current_balance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN at.topup_type IN ('TOPUP', 'REFUND') THEN at.amount ELSE 0 END), 0) as total_deposited,
    COALESCE(SUM(CASE WHEN et.expense_type IS NOT NULL THEN et.amount ELSE 0 END), 0) as total_spent,
    COALESCE(SUM(CASE WHEN at.topup_type IN ('TOPUP', 'REFUND') THEN at.amount ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN et.expense_type IS NOT NULL THEN et.amount ELSE 0 END), 0) as current_balance
  FROM prepaid_accounts pa
  LEFT JOIN (
    SELECT account_id, amount FROM account_topups WHERE account_id = account_id
  ) at ON pa.id = at.account_id
  LEFT JOIN (
    SELECT account_id, amount FROM expense_transactions WHERE account_id = account_id
  ) et ON pa.id = et.account_id
  WHERE pa.id = account_id;
END;
$$ LANGUAGE plpgsql;

-- Update the prepaid_accounts table to use correct calculations
-- First, populate account_topups with initial deposits from prepaid_accounts
INSERT INTO account_topups (account_id, amount, topup_type, topup_date, created_at)
SELECT 
  pa.id,
  pa.total_deposited,
  'TOPUP',
  NOW(),
  NOW()
FROM prepaid_accounts pa
WHERE pa.total_deposited > 0
  AND NOT EXISTS (
    SELECT 1 FROM account_topups at WHERE at.account_id = pa.id
  );

-- Now recalculate prepaid_accounts to match actual totals
UPDATE prepaid_accounts pa
SET 
  total_deposited = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM account_topups 
    WHERE account_id = pa.id AND topup_type IN ('TOPUP', 'REFUND')
  ),
  total_spent = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM expense_transactions 
    WHERE account_id = pa.id
  ),
  current_balance = (
    SELECT COALESCE(SUM(CASE WHEN topup_type IN ('TOPUP', 'REFUND') THEN amount ELSE 0 END), 0) - 
           COALESCE(SUM(CASE WHEN true THEN 0 ELSE amount END), 0)
    FROM (
      SELECT amount, 'topup' as topup_type FROM account_topups WHERE account_id = pa.id
      UNION ALL
      SELECT amount, 'expense' as expense_type FROM expense_transactions WHERE account_id = pa.id
    ) combined
  );
