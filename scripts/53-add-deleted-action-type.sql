-- Add missing action_type values to job_timeline table
-- Includes: Deleted, Updated, Payment Marked as Paid

ALTER TABLE job_timeline
DROP CONSTRAINT IF EXISTS job_timeline_action_type_check;

ALTER TABLE job_timeline
ADD CONSTRAINT job_timeline_action_type_check 
CHECK (action_type IN (
  'Created', 
  'Negotiated', 
  'Approved', 
  'Driver Assigned', 
  'Status Updated', 
  'Waybill Uploaded', 
  'Completed',
  'Deleted',
  'Updated',
  'Payment Marked as Paid'
));
