-- Add new fields to procurements table for complete workflow
ALTER TABLE procurements
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Pending',
ADD COLUMN IF NOT EXISTS waybill_number TEXT,
ADD COLUMN IF NOT EXISTS tracking_info TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery_months INTEGER,
ADD COLUMN IF NOT EXISTS delivery_reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS shipping_date DATE,
ADD COLUMN IF NOT EXISTS deal_closed_date TIMESTAMP WITH TIMEZONE;

-- Update status enum to include new statuses
COMMENT ON COLUMN procurements.status IS 'Statuses: Negotiation, Vendor Accepted, Payment Pending, Paid, In Transit, Arrived, Clearing, Onboarding, Completed';
