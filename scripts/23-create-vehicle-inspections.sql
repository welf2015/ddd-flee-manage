-- Vehicle Inspections System
-- Supports both web admin and mobile Expo app
-- Daily inspections with photo uploads (watermarked with location/timestamp)

-- Main inspections table
CREATE TABLE IF NOT EXISTS vehicle_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  inspection_time TIME NOT NULL DEFAULT CURRENT_TIME,
  odometer_reading INTEGER,
  odometer_reading_remarks TEXT,
  
  -- Vehicle Identification (Checklist items)
  vehicle_info TEXT CHECK (vehicle_info IN ('OK', 'Not OK', 'NA')),
  vehicle_info_remarks TEXT,
  
  -- Handbook & SOPs
  handbook_sops_available TEXT CHECK (handbook_sops_available IN ('OK', 'Not OK', 'NA')),
  handbook_sops_available_remarks TEXT,
  
  -- Exterior Inspection
  body_condition TEXT CHECK (body_condition IN ('OK', 'Not OK', 'NA')),
  body_condition_remarks TEXT,
  bumpers TEXT CHECK (bumpers IN ('OK', 'Not OK', 'NA')),
  bumpers_remarks TEXT,
  mirrors TEXT CHECK (mirrors IN ('OK', 'Not OK', 'NA')),
  mirrors_remarks TEXT,
  windshield TEXT CHECK (windshield IN ('OK', 'Not OK', 'NA')),
  windshield_remarks TEXT,
  windows TEXT CHECK (windows IN ('OK', 'Not OK', 'NA')),
  windows_remarks TEXT,
  wipers TEXT CHECK (wipers IN ('OK', 'Not OK', 'NA')),
  wipers_remarks TEXT,
  headlights TEXT CHECK (headlights IN ('OK', 'Not OK', 'NA')),
  headlights_remarks TEXT,
  brake_lights TEXT CHECK (brake_lights IN ('OK', 'Not OK', 'NA')),
  brake_lights_remarks TEXT,
  horn TEXT CHECK (horn IN ('OK', 'Not OK', 'NA')),
  horn_remarks TEXT,
  license_plate TEXT CHECK (license_plate IN ('OK', 'Not OK', 'NA')),
  license_plate_remarks TEXT,
  doors_locks TEXT CHECK (doors_locks IN ('OK', 'Not OK', 'NA')),
  doors_locks_remarks TEXT,
  
  -- Tires and Wheels
  tire_tread_depth TEXT CHECK (tire_tread_depth IN ('OK', 'Not OK', 'NA')),
  tire_tread_depth_remarks TEXT,
  tire_pressure TEXT CHECK (tire_pressure IN ('OK', 'Not OK', 'NA')),
  tire_pressure_remarks TEXT,
  tire_wear TEXT CHECK (tire_wear IN ('OK', 'Not OK', 'NA')),
  tire_wear_remarks TEXT,
  wheel_nuts TEXT CHECK (wheel_nuts IN ('OK', 'Not OK', 'NA')),
  wheel_nuts_remarks TEXT,
  spare_tire TEXT CHECK (spare_tire IN ('OK', 'Not OK', 'NA')),
  spare_tire_remarks TEXT,
  jack_tools TEXT CHECK (jack_tools IN ('OK', 'Not OK', 'NA')),
  jack_tools_remarks TEXT,
  
  -- Engine & Under the Hood
  coolant TEXT CHECK (coolant IN ('OK', 'Not OK', 'NA')),
  coolant_remarks TEXT,
  brake_fluid TEXT CHECK (brake_fluid IN ('OK', 'Not OK', 'NA')),
  brake_fluid_remarks TEXT,
  power_steering_fluid TEXT CHECK (power_steering_fluid IN ('OK', 'Not OK', 'NA')),
  power_steering_fluid_remarks TEXT,
  transmission_fluid TEXT CHECK (transmission_fluid IN ('OK', 'Not OK', 'NA')),
  transmission_fluid_remarks TEXT,
  battery TEXT CHECK (battery IN ('OK', 'Not OK', 'NA')),
  battery_remarks TEXT,
  belts_hoses TEXT CHECK (belts_hoses IN ('OK', 'Not OK', 'NA')),
  belts_hoses_remarks TEXT,
  air_filter TEXT CHECK (air_filter IN ('OK', 'Not OK', 'NA')),
  air_filter_remarks TEXT,
  
  -- Braking System
  service_brake TEXT CHECK (service_brake IN ('OK', 'Not OK', 'NA')),
  service_brake_remarks TEXT,
  parking_brake TEXT CHECK (parking_brake IN ('OK', 'Not OK', 'NA')),
  parking_brake_remarks TEXT,
  brake_pedal_pressure TEXT CHECK (brake_pedal_pressure IN ('OK', 'Not OK', 'NA')),
  brake_pedal_pressure_remarks TEXT,
  brake_warning_light TEXT CHECK (brake_warning_light IN ('OK', 'Not OK', 'NA')),
  brake_warning_light_remarks TEXT,
  
  -- Exhaust and Emission
  exhaust_pipe TEXT CHECK (exhaust_pipe IN ('OK', 'Not OK', 'NA')),
  exhaust_pipe_remarks TEXT,
  noise_level TEXT CHECK (noise_level IN ('OK', 'Not OK', 'NA')),
  noise_level_remarks TEXT,
  emission_compliance TEXT CHECK (emission_compliance IN ('OK', 'Not OK', 'NA')),
  emission_compliance_remarks TEXT,
  
  -- Electrical & Controls
  dashboard_lights TEXT CHECK (dashboard_lights IN ('OK', 'Not OK', 'NA')),
  dashboard_lights_remarks TEXT,
  gauges TEXT CHECK (gauges IN ('OK', 'Not OK', 'NA')),
  gauges_remarks TEXT,
  interior_lights TEXT CHECK (interior_lights IN ('OK', 'Not OK', 'NA')),
  interior_lights_remarks TEXT,
  ignition TEXT CHECK (ignition IN ('OK', 'Not OK', 'NA')),
  ignition_remarks TEXT,
  power_windows_locks TEXT CHECK (power_windows_locks IN ('OK', 'Not OK', 'NA')),
  power_windows_locks_remarks TEXT,
  
  -- Interior Condition
  seats TEXT CHECK (seats IN ('OK', 'Not OK', 'NA')),
  seats_remarks TEXT,
  seatbelts TEXT CHECK (seatbelts IN ('OK', 'Not OK', 'NA')),
  seatbelts_remarks TEXT,
  dashboard TEXT CHECK (dashboard IN ('OK', 'Not OK', 'NA')),
  dashboard_remarks TEXT,
  ac_heating TEXT CHECK (ac_heating IN ('OK', 'Not OK', 'NA')),
  ac_heating_remarks TEXT,
  cabin_lights TEXT CHECK (cabin_lights IN ('OK', 'Not OK', 'NA')),
  cabin_lights_remarks TEXT,
  fire_extinguisher TEXT CHECK (fire_extinguisher IN ('OK', 'Not OK', 'NA')),
  fire_extinguisher_remarks TEXT,
  first_aid_kit TEXT CHECK (first_aid_kit IN ('OK', 'Not OK', 'NA')),
  first_aid_kit_remarks TEXT,
  reflective_triangle TEXT CHECK (reflective_triangle IN ('OK', 'Not OK', 'NA')),
  reflective_triangle_remarks TEXT,
  cleanliness TEXT CHECK (cleanliness IN ('OK', 'Not OK', 'NA')),
  cleanliness_remarks TEXT,
  
  -- Road Test / Functional Checks
  acceleration TEXT CHECK (acceleration IN ('OK', 'Not OK', 'NA')),
  acceleration_remarks TEXT,
  gear_shifts TEXT CHECK (gear_shifts IN ('OK', 'Not OK', 'NA')),
  gear_shifts_remarks TEXT,
  steering TEXT CHECK (steering IN ('OK', 'Not OK', 'NA')),
  steering_remarks TEXT,
  braking TEXT CHECK (braking IN ('OK', 'Not OK', 'NA')),
  braking_remarks TEXT,
  noises_vibrations TEXT CHECK (noises_vibrations IN ('OK', 'Not OK', 'NA')),
  noises_vibrations_remarks TEXT,
  warning_indicators TEXT CHECK (warning_indicators IN ('OK', 'Not OK', 'NA')),
  warning_indicators_remarks TEXT,
  
  -- Comments & Corrective Actions
  defects_noted TEXT,
  recommended_repairs TEXT,
  inspector_remarks TEXT,
  supervisor_review TEXT,
  
  -- Status and metadata
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  
  -- Tracking
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one inspection per vehicle per day
  UNIQUE(vehicle_id, inspection_date)
);

-- Ensure columns exist (in case table was created with older schema)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicle_inspections' AND column_name = 'handbook_sops_available_remarks') THEN
        ALTER TABLE vehicle_inspections ADD COLUMN handbook_sops_available_remarks TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicle_inspections' AND column_name = 'odometer_reading_remarks') THEN
        ALTER TABLE vehicle_inspections ADD COLUMN odometer_reading_remarks TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicle_inspections' AND column_name = 'vehicle_info') THEN
        ALTER TABLE vehicle_inspections ADD COLUMN vehicle_info TEXT CHECK (vehicle_info IN ('OK', 'Not OK', 'NA'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicle_inspections' AND column_name = 'vehicle_info_remarks') THEN
        ALTER TABLE vehicle_inspections ADD COLUMN vehicle_info_remarks TEXT;
    END IF;
END $$;

-- Inspection photos table (watermarked with location and timestamp)
CREATE TABLE IF NOT EXISTS inspection_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES vehicle_inspections(id) ON DELETE CASCADE,
  photo_category TEXT NOT NULL CHECK (photo_category IN (
    'body_front', 'body_rear', 'body_left', 'body_right',
    'interior_dashboard', 'interior_seats', 'interior_cargo',
    'engine_bay', 'tires_front_left', 'tires_front_right',
    'tires_rear_left', 'tires_rear_right', 'damage_detail', 'other'
  )),
  photo_url TEXT NOT NULL,
  
  -- Metadata embedded in photo (watermark)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_address TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- File info
  file_size INTEGER,
  mime_type TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_vehicle ON vehicle_inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_driver ON vehicle_inspections(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_date ON vehicle_inspections(inspection_date DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_status ON vehicle_inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspection_photos_inspection ON inspection_photos(inspection_id);

-- Enable RLS
ALTER TABLE vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid errors
DROP POLICY IF EXISTS "Users can view all inspections" ON vehicle_inspections;
DROP POLICY IF EXISTS "Users can insert inspections" ON vehicle_inspections;
DROP POLICY IF EXISTS "Users can update their own inspections" ON vehicle_inspections;
DROP POLICY IF EXISTS "Admins can update any inspection" ON vehicle_inspections;
DROP POLICY IF EXISTS "Users can view all photos" ON inspection_photos;
DROP POLICY IF EXISTS "Users can insert photos" ON inspection_photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON inspection_photos;

-- RLS Policies
CREATE POLICY "Users can view all inspections" ON vehicle_inspections FOR SELECT USING (true);
CREATE POLICY "Users can insert inspections" ON vehicle_inspections FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own inspections" ON vehicle_inspections FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Admins can update any inspection" ON vehicle_inspections FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('MD', 'ED', 'Accountant', 'Head of Operations')
  )
);

CREATE POLICY "Users can view all photos" ON inspection_photos FOR SELECT USING (true);
CREATE POLICY "Users can insert photos" ON inspection_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete their own photos" ON inspection_photos FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM vehicle_inspections 
    WHERE vehicle_inspections.id = inspection_photos.inspection_id 
    AND vehicle_inspections.created_by = auth.uid()
  )
);
