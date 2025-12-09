-- Add document registration date fields to vehicle_onboarding table
ALTER TABLE vehicle_onboarding
ADD COLUMN IF NOT EXISTS vehicle_license_reg_date DATE,
ADD COLUMN IF NOT EXISTS vehicle_license_expiry_date DATE,
ADD COLUMN IF NOT EXISTS roadworthiness_reg_date DATE,
ADD COLUMN IF NOT EXISTS roadworthiness_expiry_date DATE,
ADD COLUMN IF NOT EXISTS insurance_reg_date DATE,
ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE,
ADD COLUMN IF NOT EXISTS hackney_permit_reg_date DATE,
ADD COLUMN IF NOT EXISTS hackney_permit_expiry_date DATE,
ADD COLUMN IF NOT EXISTS road_tax_reg_date DATE,
ADD COLUMN IF NOT EXISTS road_tax_expiry_date DATE,
ADD COLUMN IF NOT EXISTS lagos_state_permit_reg_date DATE,
ADD COLUMN IF NOT EXISTS lagos_state_permit_expiry_date DATE;

-- Allow N/A values by keeping dates nullable
COMMENT ON COLUMN vehicle_onboarding.vehicle_license_reg_date IS 'Registration date for vehicle license (nullable for N/A)';
COMMENT ON COLUMN vehicle_onboarding.roadworthiness_reg_date IS 'Registration date for roadworthiness certificate (nullable for N/A)';
COMMENT ON COLUMN vehicle_onboarding.insurance_reg_date IS 'Registration date for insurance (nullable for N/A)';
COMMENT ON COLUMN vehicle_onboarding.hackney_permit_reg_date IS 'Registration date for hackney permit (nullable for N/A)';
COMMENT ON COLUMN vehicle_onboarding.road_tax_reg_date IS 'Registration date for road tax (nullable for N/A)';
COMMENT ON COLUMN vehicle_onboarding.lagos_state_permit_reg_date IS 'Registration date for Lagos state permit (nullable for N/A)';
