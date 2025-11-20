-- Add company name, address, and destination contact fields to bookings table
ALTER TABLE IF EXISTS bookings 
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS client_address TEXT,
  ADD COLUMN IF NOT EXISTS destination_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS destination_contact_phone TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_company_name ON bookings(company_name);
CREATE INDEX IF NOT EXISTS idx_bookings_client_name ON bookings(client_name);

-- Update clients table to include company info
ALTER TABLE IF EXISTS clients
  ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Enable update for authenticated users" ON bookings;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON bookings;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON bookings;

-- Recreate policies
CREATE POLICY "Enable update for authenticated users"
ON bookings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable read access for all authenticated users"
ON bookings FOR SELECT
TO authenticated
USING (true);
