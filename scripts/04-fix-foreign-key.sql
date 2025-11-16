-- Fix foreign key constraint for bookings table
-- The created_by field should allow NULL if the profile doesn't exist yet

ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_created_by_fkey;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- Same for approved_by
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_approved_by_fkey;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_approved_by_fkey 
FOREIGN KEY (approved_by) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- Create a function to generate job IDs automatically
CREATE OR REPLACE FUNCTION generate_job_id()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  count INTEGER;
  new_id TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COUNT(*) + 1 INTO count
  FROM public.bookings
  WHERE job_id LIKE 'JOB-' || year || '-%';
  
  new_id := 'JOB-' || year || '-' || LPAD(count::TEXT, 4, '0');
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;
