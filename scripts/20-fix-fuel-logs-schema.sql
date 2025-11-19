-- Drop existing fuel_logs table and recreate with proper columns
DROP TABLE IF EXISTS fuel_logs CASCADE;

CREATE TABLE fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid')),
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('Liters', 'kWh')),
  cost NUMERIC NOT NULL,
  station_name TEXT,
  odometer_reading INTEGER,
  notes TEXT,
  logged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable insert for authenticated users" ON fuel_logs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable read access for all authenticated users" ON fuel_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable update for authenticated users" ON fuel_logs
  FOR UPDATE TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX idx_fuel_logs_vehicle ON fuel_logs(vehicle_id);
CREATE INDEX idx_fuel_logs_logged_at ON fuel_logs(logged_at);
CREATE INDEX idx_fuel_logs_driver ON fuel_logs(driver_id);
