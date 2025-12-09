-- Add document date fields to vehicle_onboarding table
ALTER TABLE vehicle_onboarding 
ADD COLUMN IF NOT EXISTS registration_date DATE,
ADD COLUMN IF NOT EXISTS registration_expiry_date DATE,
ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE,
ADD COLUMN IF NOT EXISTS road_worthiness_expiry_date DATE,
ADD COLUMN IF NOT EXISTS hackney_permit_expiry_date DATE,
ADD COLUMN IF NOT EXISTS vehicle_license_expiry_date DATE,
ADD COLUMN IF NOT EXISTS ownership_transfer_date DATE;

-- Add N/A flag columns for documents that may not apply
ALTER TABLE vehicle_onboarding
ADD COLUMN IF NOT EXISTS hackney_permit_na BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ownership_transfer_na BOOLEAN DEFAULT false;

-- Create index for expiry date queries (for renewal notifications)
CREATE INDEX IF NOT EXISTS idx_vehicle_onboarding_expiry_dates 
ON vehicle_onboarding(registration_expiry_date, insurance_expiry_date, road_worthiness_expiry_date, hackney_permit_expiry_date, vehicle_license_expiry_date);

-- Add document date fields to vehicles table as well
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS registration_date DATE,
ADD COLUMN IF NOT EXISTS registration_expiry_date DATE,
ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE,
ADD COLUMN IF NOT EXISTS road_worthiness_expiry_date DATE,
ADD COLUMN IF NOT EXISTS hackney_permit_expiry_date DATE,
ADD COLUMN IF NOT EXISTS vehicle_license_expiry_date DATE;

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vehicle_onboarding' 
AND column_name LIKE '%date%' OR column_name LIKE '%_na'
ORDER BY ordinal_position;
