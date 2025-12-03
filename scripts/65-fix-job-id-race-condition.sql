-- Fix job_id generation race condition by using a sequence per year

-- Create a table to track sequences for each year
CREATE TABLE IF NOT EXISTS job_id_sequences (
  year INT PRIMARY KEY,
  last_number INT DEFAULT 0
);

-- Drop and recreate the generate_job_id function with proper locking
DROP FUNCTION IF EXISTS generate_job_id();

CREATE OR REPLACE FUNCTION generate_job_id()
RETURNS TEXT AS $$
DECLARE
  year_part INT;
  next_number INT;
  job_id TEXT;
BEGIN
  -- Get current year
  year_part := EXTRACT(YEAR FROM CURRENT_DATE);

  -- Use row-level locking to prevent race conditions
  -- Insert or update the sequence for this year
  INSERT INTO job_id_sequences (year, last_number)
  VALUES (year_part, 1)
  ON CONFLICT (year)
  DO UPDATE SET last_number = job_id_sequences.last_number + 1
  RETURNING last_number INTO next_number;

  -- Format the job ID
  job_id := 'JOB-' || year_part || '-' || LPAD(next_number::TEXT, 4, '0');

  RETURN job_id;
END;
$$ LANGUAGE plpgsql;

-- Initialize the sequence table with existing bookings
INSERT INTO job_id_sequences (year, last_number)
SELECT
  EXTRACT(YEAR FROM CURRENT_DATE)::INT as year,
  COALESCE(MAX(CAST(SUBSTRING(job_id FROM 'JOB-\d{4}-(\d{4})') AS INT)), 0) as last_number
FROM bookings
WHERE job_id LIKE 'JOB-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-%'
ON CONFLICT (year) DO UPDATE SET last_number = EXCLUDED.last_number;
