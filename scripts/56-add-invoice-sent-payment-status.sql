-- Update the payment_status check constraint to include 'Invoice Sent'
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_payment_status_check 
CHECK (payment_status IN ('Unpaid', 'Invoice Sent', 'Paid'));

COMMENT ON COLUMN bookings.payment_status IS 'Payment status for completed bookings: Unpaid (default), Invoice Sent, or Paid';
