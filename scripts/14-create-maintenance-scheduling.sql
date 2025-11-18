CREATE TABLE IF NOT EXISTS public.maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_number TEXT UNIQUE NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  scheduled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  maintenance_type TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  scheduled_date DATE NOT NULL,
  estimated_cost DECIMAL(12, 2),
  actual_cost DECIMAL(12, 2),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'In Progress', 'Completed', 'Cancelled')),
  service_provider TEXT,
  completion_notes TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read for authenticated users" ON public.maintenance_schedules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.maintenance_schedules FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.maintenance_schedules FOR UPDATE USING (auth.role() = 'authenticated');

-- Function to generate maintenance schedule number
CREATE OR REPLACE FUNCTION generate_maintenance_schedule_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num TEXT;
  new_number TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  SELECT LPAD((COALESCE(MAX(CAST(SUBSTRING(schedule_number FROM 9) AS INTEGER)), 0) + 1)::TEXT, 4, '0')
  INTO sequence_num
  FROM public.maintenance_schedules
  WHERE schedule_number LIKE 'MNT-' || year_part || '-%';
  
  new_number := 'MNT-' || year_part || '-' || sequence_num;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
