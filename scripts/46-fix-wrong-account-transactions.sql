-- Fix transactions assigned to wrong accounts
-- This will move transactions to correct accounts and recalculate balances

-- Step 1: Find the correct account IDs
DO $$
DECLARE
  v_fuel_account_id UUID;
  v_ticketing_account_id UUID;
  v_allowance_account_id UUID;
  v_wrong_transaction_id UUID := '9b1a3909-e957-4adc-b49c-8b20a2fb271d';
  v_correct_account_id UUID;
  v_old_account_id UUID;
  v_transaction_amount DECIMAL(12, 2);
BEGIN
  -- Get correct account IDs
  SELECT pa.id INTO v_fuel_account_id
  FROM prepaid_accounts pa
  JOIN expense_vendors ev ON pa.vendor_id = ev.id
  WHERE ev.vendor_type = 'Fuel'
  LIMIT 1;
  
  SELECT pa.id INTO v_ticketing_account_id
  FROM prepaid_accounts pa
  JOIN expense_vendors ev ON pa.vendor_id = ev.id
  WHERE ev.vendor_type = 'Ticketing'
  LIMIT 1;
  
  SELECT pa.id INTO v_allowance_account_id
  FROM prepaid_accounts pa
  JOIN expense_vendors ev ON pa.vendor_id = ev.id
  WHERE ev.vendor_type = 'Allowance'
  LIMIT 1;
  
  -- Fix the specific wrong transaction
  SELECT account_id, amount INTO v_old_account_id, v_transaction_amount
  FROM expense_transactions
  WHERE id = v_wrong_transaction_id;
  
  -- Determine correct account based on expense_type
  SELECT account_id INTO v_correct_account_id
  FROM expense_transactions et
  WHERE et.id = v_wrong_transaction_id
    AND (
      (et.expense_type = 'Fuel' AND et.account_id = v_fuel_account_id) OR
      (et.expense_type = 'Ticketing' AND et.account_id = v_ticketing_account_id) OR
      (et.expense_type = 'Allowance' AND et.account_id = v_allowance_account_id)
    );
  
  -- If not found, set based on expense_type
  IF v_correct_account_id IS NULL THEN
    SELECT account_id INTO v_correct_account_id
    FROM expense_transactions et
    WHERE et.id = v_wrong_transaction_id;
    
    IF v_correct_account_id IS NULL THEN
      SELECT CASE 
        WHEN (SELECT expense_type FROM expense_transactions WHERE id = v_wrong_transaction_id) = 'Fuel' THEN v_fuel_account_id
        WHEN (SELECT expense_type FROM expense_transactions WHERE id = v_wrong_transaction_id) = 'Ticketing' THEN v_ticketing_account_id
        WHEN (SELECT expense_type FROM expense_transactions WHERE id = v_wrong_transaction_id) = 'Allowance' THEN v_allowance_account_id
      END INTO v_correct_account_id;
    END IF;
  END IF;
  
  -- If transaction is on wrong account, fix it
  IF v_old_account_id != v_correct_account_id AND v_correct_account_id IS NOT NULL THEN
    -- Reverse the deduction from wrong account
    UPDATE prepaid_accounts
    SET 
      current_balance = current_balance + v_transaction_amount,
      total_spent = total_spent - v_transaction_amount,
      updated_at = NOW()
    WHERE id = v_old_account_id;
    
    -- Apply deduction to correct account
    UPDATE prepaid_accounts
    SET 
      current_balance = current_balance - v_transaction_amount,
      total_spent = total_spent + v_transaction_amount,
      updated_at = NOW()
    WHERE id = v_correct_account_id;
    
    -- Update transaction to point to correct account
    UPDATE expense_transactions
    SET account_id = v_correct_account_id
    WHERE id = v_wrong_transaction_id;
    
    RAISE NOTICE 'Fixed transaction %: moved from account % to account %', 
      v_wrong_transaction_id, v_old_account_id, v_correct_account_id;
  END IF;
END $$;

-- Step 2: Fix ALL transactions that are on wrong accounts
DO $$
DECLARE
  transaction_record RECORD;
  v_fuel_account_id UUID;
  v_ticketing_account_id UUID;
  v_allowance_account_id UUID;
  v_correct_account_id UUID;
BEGIN
  -- Get correct account IDs
  SELECT pa.id INTO v_fuel_account_id
  FROM prepaid_accounts pa
  JOIN expense_vendors ev ON pa.vendor_id = ev.id
  WHERE ev.vendor_type = 'Fuel'
  LIMIT 1;
  
  SELECT pa.id INTO v_ticketing_account_id
  FROM prepaid_accounts pa
  JOIN expense_vendors ev ON pa.vendor_id = ev.id
  WHERE ev.vendor_type = 'Ticketing'
  LIMIT 1;
  
  SELECT pa.id INTO v_allowance_account_id
  FROM prepaid_accounts pa
  JOIN expense_vendors ev ON pa.vendor_id = ev.id
  WHERE ev.vendor_type = 'Allowance'
  LIMIT 1;
  
  -- Find and fix all wrong transactions
  FOR transaction_record IN
    SELECT 
      et.id,
      et.expense_type,
      et.amount,
      et.account_id as current_account_id,
      pa.account_name as current_account_name,
      ev.vendor_type as current_account_type
    FROM expense_transactions et
    JOIN prepaid_accounts pa ON et.account_id = pa.id
    JOIN expense_vendors ev ON pa.vendor_id = ev.id
    WHERE 
      (et.expense_type = 'Fuel' AND ev.vendor_type != 'Fuel') OR
      (et.expense_type = 'Ticketing' AND ev.vendor_type != 'Ticketing') OR
      (et.expense_type = 'Allowance' AND ev.vendor_type != 'Allowance')
  LOOP
    -- Determine correct account
    v_correct_account_id := CASE transaction_record.expense_type
      WHEN 'Fuel' THEN v_fuel_account_id
      WHEN 'Ticketing' THEN v_ticketing_account_id
      WHEN 'Allowance' THEN v_allowance_account_id
    END;
    
    IF v_correct_account_id IS NOT NULL AND transaction_record.current_account_id != v_correct_account_id THEN
      -- Reverse deduction from wrong account
      UPDATE prepaid_accounts
      SET 
        current_balance = current_balance + transaction_record.amount,
        total_spent = total_spent - transaction_record.amount,
        updated_at = NOW()
      WHERE id = transaction_record.current_account_id;
      
      -- Apply deduction to correct account
      UPDATE prepaid_accounts
      SET 
        current_balance = current_balance - transaction_record.amount,
        total_spent = total_spent + transaction_record.amount,
        updated_at = NOW()
      WHERE id = v_correct_account_id;
      
      -- Update transaction
      UPDATE expense_transactions
      SET account_id = v_correct_account_id
      WHERE id = transaction_record.id;
      
      RAISE NOTICE 'Fixed transaction % (%): moved from % to correct account', 
        transaction_record.id, transaction_record.expense_type, transaction_record.current_account_name;
    END IF;
  END LOOP;
END $$;

-- Step 3: Verify all transactions are now on correct accounts
SELECT 
  et.id,
  et.expense_type,
  et.amount,
  pa.account_name,
  ev.vendor_type,
  CASE 
    WHEN et.expense_type = 'Fuel' AND ev.vendor_type = 'Fuel' THEN '✅ Correct'
    WHEN et.expense_type = 'Ticketing' AND ev.vendor_type = 'Ticketing' THEN '✅ Correct'
    WHEN et.expense_type = 'Allowance' AND ev.vendor_type = 'Allowance' THEN '✅ Correct'
    ELSE '❌ Wrong'
  END as status
FROM expense_transactions et
LEFT JOIN prepaid_accounts pa ON et.account_id = pa.id
LEFT JOIN expense_vendors ev ON pa.vendor_id = ev.id
ORDER BY et.transaction_date DESC;
