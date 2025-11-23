-- Create staff directory table for tracking staff members (including those without system access)
CREATE TABLE IF NOT EXISTS staff_directory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  department TEXT,
  position TEXT,
  has_system_access BOOLEAN DEFAULT false,
  user_id UUID REFERENCES profiles(id), -- Link to actual user account if they have one
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE staff_directory ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read for authenticated users" ON staff_directory
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON staff_directory
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON staff_directory
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Update incidents table to link to staff directory instead of just profiles
ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES staff_directory(id);

-- Drop the old resolved_by_name column if it exists (we'll use the staff directory instead)
ALTER TABLE incidents DROP COLUMN IF EXISTS resolved_by_name;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_directory_active ON staff_directory(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_directory_user_id ON staff_directory(user_id);
