-- Add job_date column to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS job_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Backfill job_date with started_at if available, otherwise created_at
UPDATE public.bookings 
SET job_date = COALESCE(started_at, created_at);

-- Add index for reporting queries
CREATE INDEX IF NOT EXISTS idx_bookings_job_date ON public.bookings(job_date);

COMMENT ON COLUMN bookings.job_date IS 'Effective date of the job for reporting purposes. Defaults to creation time, but updated on assignment/start or manual edit.';
