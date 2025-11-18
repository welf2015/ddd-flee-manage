-- Add hold-up tracking and trip expenses
-- Modify job_timeline to support hold-up reasons
ALTER TABLE job_timeline ADD COLUMN IF NOT EXISTS hold_reason TEXT CHECK (hold_reason IN ('Breakdown', 'Road Safety', 'Police Issues', 'Accident', 'Other'));

-- Trip expenses are already in job_costs table, just add index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_costs_booking ON job_costs(booking_id);
CREATE INDEX IF NOT EXISTS idx_job_timeline_booking ON job_timeline(booking_id);

-- Add address geocoding columns to bookings for map integration
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_address TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_lat NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pickup_lng NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS delivery_lat NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS delivery_lng NUMERIC;
