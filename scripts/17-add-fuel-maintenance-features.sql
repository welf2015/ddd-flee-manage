-- Add fuel/charging tracking
CREATE TABLE IF NOT EXISTS fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id),
  booking_id UUID REFERENCES bookings(id),
  fuel_type TEXT CHECK (fuel_type IN ('Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid')),
  quantity DECIMAL(10, 2),
  unit TEXT CHECK (unit IN ('Liters', 'kWh', 'kg')),
  cost DECIMAL(12, 2),
  odometer_reading INTEGER,
  station_name TEXT,
  station_location TEXT,
  receipt_url TEXT,
  notes TEXT,
  logged_by UUID REFERENCES profiles(id),
  logged_at TIMESTAMPTZ DEFAULT now()
);

-- Add maintenance schedule tracking with 3-month reminders
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS last_maintenance_date DATE,
ADD COLUMN IF NOT EXISTS next_maintenance_due DATE,
ADD COLUMN IF NOT EXISTS maintenance_frequency_months INTEGER DEFAULT 3;

-- Function to calculate next maintenance date
CREATE OR REPLACE FUNCTION update_next_maintenance_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_maintenance_date IS NOT NULL THEN
    NEW.next_maintenance_due := NEW.last_maintenance_date + (NEW.maintenance_frequency_months || ' months')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_next_maintenance_trigger
BEFORE INSERT OR UPDATE OF last_maintenance_date, maintenance_frequency_months
ON vehicles
FOR EACH ROW
EXECUTE FUNCTION update_next_maintenance_date();

-- Enhanced incidents table
ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS incident_date DATE,
ADD COLUMN IF NOT EXISTS incident_time TIME,
ADD COLUMN IF NOT EXISTS incident_type TEXT CHECK (incident_type IN ('Accident', 'Breakdown', 'Theft', 'Other')),
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS injuries_damages TEXT,
ADD COLUMN IF NOT EXISTS third_parties_involved TEXT,
ADD COLUMN IF NOT EXISTS witnesses TEXT,
ADD COLUMN IF NOT EXISTS tow_service_contacted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tow_service_details TEXT,
ADD COLUMN IF NOT EXISTS police_contacted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS police_reference TEXT,
ADD COLUMN IF NOT EXISTS support_notified TEXT,
ADD COLUMN IF NOT EXISTS replacement_vehicle_id UUID REFERENCES vehicles(id),
ADD COLUMN IF NOT EXISTS insurance_claim_filed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS insurance_reference TEXT,
ADD COLUMN IF NOT EXISTS vehicle_towed_to TEXT,
ADD COLUMN IF NOT EXISTS repairs_authorized_by TEXT,
ADD COLUMN IF NOT EXISTS total_amount_spent DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS date_returned_to_service DATE,
ADD COLUMN IF NOT EXISTS report_prepared_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS final_comments TEXT,
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('Open', 'Closed', 'Insurance', 'Tow')) DEFAULT 'Open';

-- Create index for maintenance reminders
CREATE INDEX IF NOT EXISTS idx_vehicles_next_maintenance ON vehicles(next_maintenance_due);
