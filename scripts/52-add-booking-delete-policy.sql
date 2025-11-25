-- Add DELETE policy for bookings table
-- Only MD and ED can delete bookings

DROP POLICY IF EXISTS "Enable delete for MD and ED" ON bookings;

CREATE POLICY "Enable delete for MD and ED"
ON bookings FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('MD', 'ED')
  )
);

-- Add DELETE policies for related tables that are deleted as part of booking deletion
-- These allow authenticated users to delete related records when deleting a booking

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON booking_files;
CREATE POLICY "Enable delete for authenticated users"
ON booking_files FOR DELETE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON negotiation_threads;
CREATE POLICY "Enable delete for authenticated users"
ON negotiation_threads FOR DELETE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON job_timeline;
CREATE POLICY "Enable delete for authenticated users"
ON job_timeline FOR DELETE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON job_costs;
CREATE POLICY "Enable delete for authenticated users"
ON job_costs FOR DELETE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON notifications;
CREATE POLICY "Enable delete for authenticated users"
ON notifications FOR DELETE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON waybill_uploads;
CREATE POLICY "Enable delete for authenticated users"
ON waybill_uploads FOR DELETE
TO authenticated
USING (true);
