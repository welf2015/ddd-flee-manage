-- Add negotiation fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS current_negotiation_amount DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS negotiation_status TEXT CHECK (negotiation_status IN ('None', 'Pending', 'Accepted')) DEFAULT 'None',
ADD COLUMN IF NOT EXISTS assigned_driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS additional_costs TEXT,
ADD COLUMN IF NOT EXISTS requires_waybill BOOLEAN DEFAULT FALSE;

-- Create negotiation threads table
CREATE TABLE IF NOT EXISTS public.negotiation_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  proposed_amount DECIMAL(12, 2),
  proposed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  comments TEXT,
  counter_amount DECIMAL(12, 2),
  counter_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  counter_comments TEXT,
  status TEXT CHECK (status IN ('Proposed', 'Countered', 'Accepted')) DEFAULT 'Proposed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job timeline/activity table
CREATE TABLE IF NOT EXISTS public.job_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('Created', 'Negotiated', 'Approved', 'Driver Assigned', 'Status Updated', 'Waybill Uploaded', 'Completed')),
  old_value TEXT,
  new_value TEXT,
  action_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create waybill uploads table
CREATE TABLE IF NOT EXISTS public.waybill_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.negotiation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waybill_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for authenticated users" ON public.negotiation_threads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.negotiation_threads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.negotiation_threads FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.job_timeline FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.job_timeline FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.waybill_uploads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.waybill_uploads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
