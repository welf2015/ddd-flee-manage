-- Fix driver table to use text fields for emergency contact instead of UUID
ALTER TABLE public.drivers
DROP COLUMN IF EXISTS emergency_contact_id;

-- Ensure all new columns exist
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;

-- Update vehicle assignment to show only available
UPDATE public.vehicles
SET status = 'Available'
WHERE status = 'Active' AND id NOT IN (
  SELECT assigned_vehicle_id FROM drivers WHERE assigned_vehicle_id IS NOT NULL
);
