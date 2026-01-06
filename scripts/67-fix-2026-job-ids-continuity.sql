-- Fix the 2026 job IDs to continue from 2025's highest counter (0055)
-- Update the three existing 2026 jobs to have sequential IDs starting from 0056

UPDATE bookings
SET job_id = 'JOB-2026-0056'
WHERE job_id = 'JOB-2026-0001';

UPDATE bookings
SET job_id = 'JOB-2026-0057'
WHERE job_id = 'JOB-2026-0002';

UPDATE bookings
SET job_id = 'JOB-2026-0058'
WHERE job_id = 'JOB-2026-0003';

-- Update the job_id_sequences table to set 2026 sequence to 58
-- This ensures the next job created in 2026 will be JOB-2026-0059
UPDATE job_id_sequences
SET last_number = 58
WHERE year = 2026;
