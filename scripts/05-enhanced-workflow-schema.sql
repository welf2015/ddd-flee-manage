-- Enhanced workflow schema with driver assignment, ratings, and job tracking

-- Update bookings table with new statuses and fields
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS assigned_driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS expected_completion TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS requires_waybill BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS additional_costs TEXT,
  ADD CONSTRAINT bookings_status_check CHECK (
    status IN ('Open', 'Negotiation', 'Approved', 'Assigned', 'In Progress', 'In Transit', 'Completed', 'Closed')
  );

-- Update drivers table with enhanced status
ALTER TABLE public.drivers DROP CONSTRAINT IF EXISTS drivers_status_check;
ALTER TABLE public.drivers 
  ADD COLUMN IF NOT EXISTS current_job_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  ADD CONSTRAINT drivers_status_check CHECK (
    status IN ('Active', 'Assigned to Job', 'Currently on Job', 'Inactive')
  );

-- Create driver ratings table
CREATE TABLE IF NOT EXISTS public.driver_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  client_feedback TEXT,
  rated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job costs table for additional expenses
CREATE TABLE IF NOT EXISTS public.job_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  cost_type TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  receipt_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for new tables
ALTER TABLE public.driver_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all authenticated users" ON public.driver_ratings 
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.driver_ratings 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all authenticated users" ON public.job_costs 
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.job_costs 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create function to update driver status when assigned to job
CREATE OR REPLACE FUNCTION update_driver_status_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_driver_id IS NOT NULL AND OLD.assigned_driver_id IS NULL THEN
    UPDATE public.drivers 
    SET status = 'Assigned to Job', current_job_id = NEW.id
    WHERE id = NEW.assigned_driver_id;
  END IF;
  
  IF NEW.status = 'In Progress' AND OLD.status != 'In Progress' THEN
    UPDATE public.drivers 
    SET status = 'Currently on Job'
    WHERE id = NEW.assigned_driver_id;
  END IF;
  
  IF NEW.status IN ('Completed', 'Closed') AND OLD.status NOT IN ('Completed', 'Closed') THEN
    UPDATE public.drivers 
    SET status = 'Active', current_job_id = NULL
    WHERE id = NEW.assigned_driver_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for driver status updates
DROP TRIGGER IF EXISTS trigger_update_driver_status ON public.bookings;
CREATE TRIGGER trigger_update_driver_status
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_status_on_assignment();

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_driver ON public.bookings(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_drivers_current_job ON public.drivers(current_job_id);
CREATE INDEX IF NOT EXISTS idx_driver_ratings_driver ON public.driver_ratings(driver_id);
