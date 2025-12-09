-- Add DELETE policy for account_topups table
-- This allows authenticated users to delete top-ups (should be restricted to MD/ED roles in the app)

DROP POLICY IF EXISTS "Allow authenticated users to delete account topups" ON account_topups;

CREATE POLICY "Allow authenticated users to delete account topups"
ON account_topups
FOR DELETE
TO authenticated
USING (true);

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'account_topups'
ORDER BY cmd;
