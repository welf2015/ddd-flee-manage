-- Add photo_url column to incidents table
ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_incidents_photo_url ON incidents(photo_url);
