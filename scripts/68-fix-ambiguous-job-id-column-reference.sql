-- Fix the ambiguous job_id column reference in generate_job_id function

DROP FUNCTION IF EXISTS generate_job_id();

CREATE OR REPLACE FUNCTION generate_job_id()
RETURNS TEXT AS $$
DECLARE
  year_part INT;
  next_number INT;
  new_job_id TEXT;
  max_previous_year INT;
BEGIN
  -- Get current year
  year_part := EXTRACT(YEAR FROM CURRENT_DATE);

  -- Check if this year's sequence exists, if not initialize it from previous year's max
  INSERT INTO job_id_sequences (year, last_number)
  VALUES (year_part, COALESCE(
    (SELECT COALESCE(MAX(CAST(SUBSTRING(bookings.job_id FROM '\d{4}$') AS INT)), 0)
     FROM bookings
     WHERE bookings.job_id LIKE 'JOB-%'),
    0
  ))
  ON CONFLICT (year) DO NOTHING;

  -- Get next number for current year with proper increment
  UPDATE job_id_sequences
  SET last_number = last_number + 1
  WHERE year = year_part
  RETURNING last_number INTO next_number;

  -- Format the job ID
  new_job_id := 'JOB-' || year_part || '-' || LPAD(next_number::TEXT, 4, '0');

  RETURN new_job_id;
END;
$$ LANGUAGE plpgsql;
