-- Remove duplicate empty accounts
-- Keep only the accounts that have actual data (transactions or top-ups)
-- This fixes the issue where duplicate accounts were created and empty ones are being selected

-- Find and delete duplicate empty accounts
DO $$
DECLARE
  account_record RECORD;
  v_keep_account_id UUID;
  v_delete_account_id UUID;
BEGIN
  -- For each vendor type, find duplicates and keep the one with data
  FOR account_record IN
    SELECT 
      ev.vendor_type,
      pa.id,
      pa.account_name,
      pa.current_balance,
      pa.total_deposited,
      pa.total_spent,
      COUNT(DISTINCT at.id) as topup_count,
      COUNT(DISTINCT et.id) as transaction_count
    FROM prepaid_accounts pa
    JOIN expense_vendors ev ON pa.vendor_id = ev.id
    LEFT JOIN account_topups at ON pa.id = at.account_id
    LEFT JOIN expense_transactions et ON pa.id = et.account_id
    GROUP BY ev.vendor_type, pa.id, pa.account_name, pa.current_balance, pa.total_deposited, pa.total_spent
    HAVING COUNT(*) > 1 OR (
      -- Find accounts with same name and vendor type
      EXISTS (
        SELECT 1 FROM prepaid_accounts pa2
        JOIN expense_vendors ev2 ON pa2.vendor_id = ev2.id
        WHERE pa2.account_name = pa.account_name
          AND ev2.vendor_type = ev.vendor_type
          AND pa2.id != pa.id
      )
    )
    ORDER BY ev.vendor_type, pa.account_name, 
      CASE 
        WHEN pa.current_balance != 0 OR pa.total_deposited != 0 OR pa.total_spent != 0 THEN 0
        ELSE 1
      END,
      pa.updated_at DESC
  LOOP
    -- For each duplicate group, keep the one with data or most recent
    -- Delete the empty ones
    IF account_record.current_balance = 0 
       AND account_record.total_deposited = 0 
       AND account_record.total_spent = 0
       AND account_record.topup_count = 0
       AND account_record.transaction_count = 0 THEN
      
      -- Check if there's another account with the same name that has data
      SELECT pa2.id INTO v_keep_account_id
      FROM prepaid_accounts pa2
      JOIN expense_vendors ev2 ON pa2.vendor_id = ev2.id
      WHERE pa2.account_name = account_record.account_name
        AND ev2.vendor_type = account_record.vendor_type
        AND pa2.id != account_record.id
        AND (
          pa2.current_balance != 0 
          OR pa2.total_deposited != 0 
          OR pa2.total_spent != 0
        )
      LIMIT 1;
      
      IF v_keep_account_id IS NOT NULL THEN
        -- Delete the empty duplicate
        DELETE FROM prepaid_accounts WHERE id = account_record.id;
        RAISE NOTICE 'Deleted duplicate empty account: % (ID: %)', account_record.account_name, account_record.id;
      END IF;
    END IF;
  END LOOP;
END $$;

-- Verify no duplicates remain
SELECT 
  ev.vendor_type,
  pa.account_name,
  COUNT(*) as account_count,
  STRING_AGG(pa.id::text, ', ') as account_ids,
  STRING_AGG(pa.current_balance::text, ', ') as balances
FROM prepaid_accounts pa
JOIN expense_vendors ev ON pa.vendor_id = ev.id
GROUP BY ev.vendor_type, pa.account_name
HAVING COUNT(*) > 1;

-- Show final account list
SELECT 
  pa.id,
  pa.account_name,
  ev.vendor_type,
  pa.current_balance,
  pa.total_deposited,
  pa.total_spent,
  pa.created_at,
  pa.updated_at
FROM prepaid_accounts pa
JOIN expense_vendors ev ON pa.vendor_id = ev.id
ORDER BY ev.vendor_type, pa.account_name;

