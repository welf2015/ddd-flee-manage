-- Fix DELETE policies for vendors and clearing_agents tables
-- This allows authenticated users to delete vendors and clearing agents

-- Drop existing DELETE policies if they exist
DROP POLICY IF EXISTS "Users can delete vendors" ON vendors;
DROP POLICY IF EXISTS "Users can delete clearing agents" ON clearing_agents;
DROP POLICY IF EXISTS "Authenticated users can delete vendors" ON vendors;
DROP POLICY IF EXISTS "Authenticated users can delete clearing agents" ON clearing_agents;

-- Create new DELETE policies for vendors
CREATE POLICY "Authenticated users can delete vendors"
ON vendors
FOR DELETE
TO authenticated
USING (true);

-- Create new DELETE policies for clearing_agents
CREATE POLICY "Authenticated users can delete clearing agents"
ON clearing_agents
FOR DELETE
TO authenticated
USING (true);

-- Verify policies are created
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('vendors', 'clearing_agents')
AND cmd = 'DELETE';
