-- This migration identifies jobs with recorded expenses but no corresponding transactions
-- and refunds them to their respective prepaid accounts

-- First, let's identify all bookings that had expenses but transactions were deleted
-- by checking booking expense amounts against actual transaction totals

-- For Ticketing - find all bookings with ticketing_amount > 0 but no ticketing transactions
INSERT INTO account_topups (account_id, amount, topup_type, topup_date, receipt_number, notes)
SELECT 
  pa.id,
  SUM(b.ticketing_amount),
  'refund',
  NOW(),
  CONCAT('REFUND-TICKETING-BATCH-', DATE(NOW())),
  CONCAT('Batch refund for deleted ticketing transactions - ', COUNT(*), ' jobs affected')
FROM bookings b
INNER JOIN prepaid_accounts pa ON pa.account_name = 'Nigerian Ports Authority'
WHERE b.ticketing_amount > 0
  AND NOT EXISTS (
    SELECT 1 FROM expense_transactions et 
    WHERE et.booking_id = b.id AND et.expense_type = 'Ticketing'
  )
GROUP BY pa.id
HAVING SUM(b.ticketing_amount) > 0;

-- For Allowance - find all bookings with allowance_amount > 0 but no allowance transactions
INSERT INTO account_topups (account_id, amount, topup_type, topup_date, receipt_number, notes)
SELECT 
  pa.id,
  SUM(b.allowance_amount),
  'refund',
  NOW(),
  CONCAT('REFUND-ALLOWANCE-BATCH-', DATE(NOW())),
  CONCAT('Batch refund for deleted allowance transactions - ', COUNT(*), ' jobs affected')
FROM bookings b
INNER JOIN prepaid_accounts pa ON pa.account_name = 'Allowance Account'
WHERE b.allowance_amount > 0
  AND NOT EXISTS (
    SELECT 1 FROM expense_transactions et 
    WHERE et.booking_id = b.id AND et.expense_type = 'Allowance'
  )
GROUP BY pa.id
HAVING SUM(b.allowance_amount) > 0;

-- Now update the prepaid account balances to reflect these refunds
UPDATE prepaid_accounts
SET 
  current_balance = current_balance + (
    SELECT COALESCE(SUM(b.ticketing_amount), 0)
    FROM bookings b
    WHERE NOT EXISTS (
      SELECT 1 FROM expense_transactions et 
      WHERE et.booking_id = b.id AND et.expense_type = 'Ticketing'
    )
  )
WHERE account_name = 'Nigerian Ports Authority';

UPDATE prepaid_accounts
SET 
  current_balance = current_balance + (
    SELECT COALESCE(SUM(b.allowance_amount), 0)
    FROM bookings b
    WHERE NOT EXISTS (
      SELECT 1 FROM expense_transactions et 
      WHERE et.booking_id = b.id AND et.expense_type = 'Allowance'
    )
  )
WHERE account_name = 'Allowance Account';

-- Log the results
SELECT 
  'REFUND SUMMARY' as summary,
  account_name,
  COALESCE(SUM(amount), 0) as total_refunded,
  COUNT(*) as refund_entries
FROM (
  SELECT pa.account_name, at.amount
  FROM account_topups at
  INNER JOIN prepaid_accounts pa ON at.account_id = pa.id
  WHERE at.topup_type = 'refund' 
    AND at.topup_date >= NOW() - INTERVAL '1 hour'
) refunds
GROUP BY account_name;
