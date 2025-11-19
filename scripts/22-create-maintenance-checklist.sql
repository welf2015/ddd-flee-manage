-- Create maintenance checklist table to store detailed inspection items
CREATE TABLE IF NOT EXISTS public.maintenance_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_log_id UUID REFERENCES public.maintenance_logs(id) ON DELETE CASCADE,
  
  -- Checklist items with condition and remarks
  coolant_level TEXT CHECK (coolant_level IN ('Yes', 'No', 'NA')),
  coolant_level_remarks TEXT,
  coolant_level_action TEXT,
  
  brake_fluid TEXT CHECK (brake_fluid IN ('Yes', 'No', 'NA')),
  brake_fluid_remarks TEXT,
  brake_fluid_action TEXT,
  
  transmission_fluid TEXT CHECK (transmission_fluid IN ('Yes', 'No', 'NA')),
  transmission_fluid_remarks TEXT,
  transmission_fluid_action TEXT,
  
  power_steering_fluid TEXT CHECK (power_steering_fluid IN ('Yes', 'No', 'NA')),
  power_steering_fluid_remarks TEXT,
  power_steering_fluid_action TEXT,
  
  battery_condition TEXT CHECK (battery_condition IN ('Yes', 'No', 'NA')),
  battery_condition_remarks TEXT,
  battery_condition_action TEXT,
  
  lights_horn TEXT CHECK (lights_horn IN ('Yes', 'No', 'NA')),
  lights_horn_remarks TEXT,
  lights_horn_action TEXT,
  
  wiper_blades TEXT CHECK (wiper_blades IN ('Yes', 'No', 'NA')),
  wiper_blades_remarks TEXT,
  wiper_blades_action TEXT,
  
  tire_condition TEXT CHECK (tire_condition IN ('Yes', 'No', 'NA')),
  tire_condition_remarks TEXT,
  tire_condition_action TEXT,
  
  air_conditioning TEXT CHECK (air_conditioning IN ('Yes', 'No', 'NA')),
  air_conditioning_remarks TEXT,
  air_conditioning_action TEXT,
  
  dashboard_lights TEXT CHECK (dashboard_lights IN ('Yes', 'No', 'NA')),
  dashboard_lights_remarks TEXT,
  dashboard_lights_action TEXT,
  
  seat_belts TEXT CHECK (seat_belts IN ('Yes', 'No', 'NA')),
  seat_belts_remarks TEXT,
  seat_belts_action TEXT,
  
  air_bags TEXT CHECK (air_bags IN ('Yes', 'No', 'NA')),
  air_bags_remarks TEXT,
  air_bags_action TEXT,
  
  safety_equipment TEXT CHECK (safety_equipment IN ('Yes', 'No', 'NA')),
  safety_equipment_remarks TEXT,
  safety_equipment_action TEXT,
  
  -- Metadata
  last_updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add additional fields to maintenance_logs table
ALTER TABLE public.maintenance_logs
ADD COLUMN IF NOT EXISTS current_mileage INTEGER,
ADD COLUMN IF NOT EXISTS service_centre TEXT,
ADD COLUMN IF NOT EXISTS nature_of_fault TEXT,
ADD COLUMN IF NOT EXISTS parts_replaced TEXT,
ADD COLUMN IF NOT EXISTS repair_duration_from TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS repair_duration_to TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS vehicle_downtime_days INTEGER,
ADD COLUMN IF NOT EXISTS repair_amount DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS remarks TEXT,
ADD COLUMN IF NOT EXISTS logged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.maintenance_checklist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read for authenticated users" ON public.maintenance_checklist FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.maintenance_checklist FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.maintenance_checklist FOR UPDATE USING (auth.role() = 'authenticated');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_maintenance_checklist_log_id ON public.maintenance_checklist(maintenance_log_id);
