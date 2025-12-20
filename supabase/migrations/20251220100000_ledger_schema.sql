-- Ledger Architecture Migration
-- 1. Add new columns
ALTER TABLE driver_spending_transactions 
ADD COLUMN IF NOT EXISTS direction text CHECK (direction IN ('CREDIT', 'DEBIT')),
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- 2. Backfill existing data
UPDATE driver_spending_transactions 
SET direction = 'CREDIT' 
WHERE transaction_type IN ('top_up', 'refund') AND direction IS NULL;

UPDATE driver_spending_transactions 
SET direction = 'DEBIT' 
WHERE transaction_type IN ('expense', 'manual_debit') AND direction IS NULL;

-- 3. Enforce Not Null after backfill
ALTER TABLE driver_spending_transactions 
ALTER COLUMN direction SET NOT NULL;

-- 4. Add index for performance
CREATE INDEX IF NOT EXISTS idx_transactions_direction ON driver_spending_transactions(direction);
CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON driver_spending_transactions(deleted_at);
