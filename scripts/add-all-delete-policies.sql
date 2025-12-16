-- Add DELETE policies for all tables to allow authenticated users to delete records
-- This script adds RLS DELETE policies for vehicles, drivers, clients, incidents, and vehicle_onboarding tables

-- ============================================
-- VEHICLES TABLE
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can delete vehicles" ON vehicles;

CREATE POLICY "Authenticated users can delete vehicles"
ON vehicles
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- DRIVERS TABLE
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can delete drivers" ON drivers;

CREATE POLICY "Authenticated users can delete drivers"
ON drivers
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- CLIENTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON clients;

CREATE POLICY "Authenticated users can delete clients"
ON clients
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- INCIDENTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can delete incidents" ON incidents;

CREATE POLICY "Authenticated users can delete incidents"
ON incidents
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- VEHICLE_ONBOARDING TABLE
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can delete vehicle_onboarding" ON vehicle_onboarding;

CREATE POLICY "Authenticated users can delete vehicle_onboarding"
ON vehicle_onboarding
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- VERIFY POLICIES
-- ============================================
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('vehicles', 'drivers', 'clients', 'incidents', 'vehicle_onboarding')
AND cmd = 'DELETE'
ORDER BY tablename, policyname;
