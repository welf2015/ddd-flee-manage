-- Add driver_rating column (overall rating) to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5);

-- Add driver_feedback column for written feedback
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS driver_feedback TEXT;

-- Add comments
COMMENT ON COLUMN bookings.driver_rating IS 'Overall driver rating (1-5 stars) - primary rating for driver behavior';
COMMENT ON COLUMN bookings.punctuality_rating IS 'Driver punctuality rating (1-5 stars)';
COMMENT ON COLUMN bookings.vehicle_condition_rating IS 'Vehicle condition rating (1-5 stars)';
COMMENT ON COLUMN bookings.communication_rating IS 'Driver communication rating (1-5 stars)';
COMMENT ON COLUMN bookings.driver_feedback IS 'Written feedback from customer about driver performance';

-- Add index for driver ratings lookup
CREATE INDEX IF NOT EXISTS idx_bookings_driver_ratings ON bookings(assigned_driver_id, driver_rating) WHERE driver_rating IS NOT NULL;
