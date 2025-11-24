-- Add payment_status field to bookings table
ALTER TABLE IF EXISTS bookings 
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Paid'));

-- Update existing Completed bookings to have Unpaid status
UPDATE bookings 
SET payment_status = 'Unpaid' 
WHERE status = 'Completed' AND payment_status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN bookings.payment_status IS 'Payment status for completed bookings: Unpaid (default) or Paid';
