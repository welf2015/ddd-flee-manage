-- Add DELETE policy for maintenance_logs table
-- This was missing from the previous script

DROP POLICY IF EXISTS "Authenticated users can delete maintenance_logs" ON maintenance_logs;

CREATE POLICY "Authenticated users can delete maintenance_logs"
ON maintenance_logs
FOR DELETE
TO authenticated
USING (true);

-- Verify the policy was created
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'maintenance_logs'
AND cmd = 'DELETE';
