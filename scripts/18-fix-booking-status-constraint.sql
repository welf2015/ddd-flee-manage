-- Update the bookings status check constraint to include all statuses being used
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN (
  'Open', 
  'Review', 
  'Negotiation', 
  'Approved', 
  'Assigned',
  'In Progress',
  'In Transit',
  'On Hold',
  'Completed',
  'Closed'
));
