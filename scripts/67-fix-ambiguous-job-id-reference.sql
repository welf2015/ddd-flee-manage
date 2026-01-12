-- Fix the ambiguous job_id reference in generate_job_id function
-- The issue was that SUBSTRING was referencing job_id without table alias

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

  -- Fixed ambiguous job_id reference - explicitly qualify bookings.job_id
  -- Check if this year's sequence exists, if not initialize it from previous year's max
  INSERT INTO job_id_sequences (year, last_number)
  VALUES (year_part, COALESCE(
    (SELECT COALESCE(MAX(CAST(SUBSTRING(b.job_id FROM '\d{4}$') AS INT)), 0)
     FROM bookings b
     WHERE b.job_id LIKE 'JOB-%'),
    0
  ))
  ON CONFLICT (year) DO NOTHING;

  -- Get next number for current year with proper increment
  UPDATE job_id_sequences
  SET last_number = last_number + 1
  WHERE year = year_part
  RETURNING last_number INTO next_number;

  -- Format the job ID
  job_id := 'JOB-' || year_part || '-' || LPAD(next_number::TEXT, 4, '0');

  RETURN job_id;
END;
$$ LANGUAGE plpgsql;

-- Also fix the initialization query with explicit table reference
TRUNCATE job_id_sequences;
INSERT INTO job_id_sequences (year, last_number)
SELECT
  EXTRACT(YEAR FROM CURRENT_DATE)::INT as year,
  COALESCE(MAX(CAST(SUBSTRING(b.job_id FROM '\d{4}$') AS INT)), 0) as last_number
FROM bookings b
WHERE b.job_id LIKE 'JOB-%'
ON CONFLICT (year) DO UPDATE SET last_number = EXCLUDED.last_number;
