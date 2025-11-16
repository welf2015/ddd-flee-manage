-- Set role for existing user (replace with your actual email)
UPDATE public.profiles 
SET role = 'MD', full_name = 'Admin User'
WHERE email = 'mrolabola@gmail.com';

-- Add new columns to drivers table
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;

-- Add license expiry date if missing
ALTER TABLE public.drivers 
ALTER COLUMN license_expiry SET DEFAULT (CURRENT_DATE + INTERVAL '2 years');
