-- Enable the account balance triggers
-- These triggers were created but disabled, causing balances not to update

-- First, ensure the trigger functions exist and are correct
CREATE OR REPLACE FUNCTION update_account_balance_on_topup()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE prepaid_accounts
  SET 
    current_balance = current_balance + NEW.amount,
    total_deposited = total_deposited + NEW.amount,
    updated_at = NOW()
  WHERE id = NEW.account_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION deduct_account_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE prepaid_accounts
  SET 
    current_balance = current_balance - NEW.amount,
    total_spent = total_spent + NEW.amount,
    updated_at = NOW()
  WHERE id = NEW.account_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_update_account_balance_on_topup ON account_topups;
DROP TRIGGER IF EXISTS trigger_deduct_account_balance_on_transaction ON expense_transactions;

-- Recreate triggers with explicit ENABLE
CREATE TRIGGER trigger_update_account_balance_on_topup
  AFTER INSERT ON account_topups
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance_on_topup();

CREATE TRIGGER trigger_deduct_account_balance_on_transaction
  AFTER INSERT ON expense_transactions
  FOR EACH ROW
  EXECUTE FUNCTION deduct_account_balance_on_transaction();

-- Explicitly enable triggers (set to 'A' = Always)
ALTER TABLE account_topups ENABLE ALWAYS TRIGGER trigger_update_account_balance_on_topup;
ALTER TABLE expense_transactions ENABLE ALWAYS TRIGGER trigger_deduct_account_balance_on_transaction;

-- Verify triggers are now enabled
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  CASE tgenabled
    WHEN 'O' THEN 'Disabled (Origin)'
    WHEN 'A' THEN 'Enabled (Always)'
    WHEN 'R' THEN 'Disabled (Replica)'
    WHEN 'D' THEN 'Disabled'
    ELSE 'Unknown'
  END as status
FROM pg_trigger
WHERE tgname IN (
  'trigger_update_account_balance_on_topup',
  'trigger_deduct_account_balance_on_transaction'
);

-- If there are existing top-ups or transactions, we need to recalculate balances
-- This will fix any accounts that have top-ups but zero balances
DO $$
DECLARE
  account_record RECORD;
  calculated_balance DECIMAL(12, 2);
  calculated_deposited DECIMAL(12, 2);
  calculated_spent DECIMAL(12, 2);
BEGIN
  FOR account_record IN 
    SELECT pa.id, pa.account_name
    FROM prepaid_accounts pa
  LOOP
    -- Calculate actual values from transactions
    SELECT 
      COALESCE(SUM(at.amount), 0),
      COALESCE(SUM(et.amount), 0)
    INTO calculated_deposited, calculated_spent
    FROM prepaid_accounts pa2
    LEFT JOIN account_topups at ON pa2.id = at.account_id
    LEFT JOIN expense_transactions et ON pa2.id = et.account_id
    WHERE pa2.id = account_record.id
    GROUP BY pa2.id;
    
    calculated_balance := calculated_deposited - calculated_spent;
    
    -- Update the account with correct values
    UPDATE prepaid_accounts
    SET 
      current_balance = calculated_balance,
      total_deposited = calculated_deposited,
      total_spent = calculated_spent,
      updated_at = NOW()
    WHERE id = account_record.id;
    
    RAISE NOTICE 'Updated account %: balance=%, deposited=%, spent=%', 
      account_record.account_name, calculated_balance, calculated_deposited, calculated_spent;
  END LOOP;
END $$;
