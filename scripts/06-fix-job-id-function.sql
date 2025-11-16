-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS generate_job_id();

-- Create the function to generate job IDs
CREATE OR REPLACE FUNCTION generate_job_id()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  next_number INT;
  job_id TEXT;
BEGIN
  -- Get current year
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Get the next number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(job_id FROM 'JOB-' || year_part || '-(\d{4})') AS INT)), 0) + 1
  INTO next_number
  FROM bookings
  WHERE job_id LIKE 'JOB-' || year_part || '-%';
  
  -- Format the job ID
  job_id := 'JOB-' || year_part || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN job_id;
END;
$$ LANGUAGE plpgsql;
