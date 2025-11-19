-- Add email and user_id to drivers table to link with Supabase Auth
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_email ON drivers(email);

-- Update vehicle_inspections to ensure we can track reviews properly
-- (Already has status, approved_by, approved_at from script 23)
