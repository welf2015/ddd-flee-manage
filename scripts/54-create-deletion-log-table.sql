-- Create a separate deletion_log table for tracking deleted bookings
-- This table doesn't cascade, so deletion logs persist even after bookings are deleted

CREATE TABLE IF NOT EXISTS deletion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL CHECK (module IN ('Booking', 'Procurement', 'Vehicle', 'Driver', 'Other')),
  reference_id TEXT NOT NULL, -- e.g., job_id, procurement_number
  reference_uuid UUID, -- The actual UUID of the deleted record
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  deleted_by_role TEXT,
  deleted_by_name TEXT,
  deleted_by_email TEXT,
  description TEXT,
  metadata JSONB, -- Store additional context about the deletion
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE deletion_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for authenticated users"
ON deletion_log FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON deletion_log FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add deletion_log to system_activity_log view
CREATE OR REPLACE VIEW system_activity_log AS
-- Procurement activities
SELECT 
  pt.id,
  pt.created_at,
  'Procurement' as module,
  pt.action_type as action,
  p.procurement_number as reference_id,
  pt.notes as description,
  pt.action_by as user_id,
  prof.full_name as user_name,
  prof.email as user_email,
  pt.old_value,
  pt.new_value
FROM procurement_timeline pt
LEFT JOIN procurements p ON pt.procurement_id = p.id
LEFT JOIN profiles prof ON pt.action_by = prof.id

UNION ALL

-- Booking/Job activities
SELECT 
  jt.id,
  jt.created_at,
  'Booking' as module,
  jt.action_type as action,
  b.job_id as reference_id,
  jt.notes as description,
  jt.action_by as user_id,
  prof.full_name as user_name,
  prof.email as user_email,
  jt.old_value,
  jt.new_value
FROM job_timeline jt
LEFT JOIN bookings b ON jt.booking_id = b.id
LEFT JOIN profiles prof ON jt.action_by = prof.id

UNION ALL

-- Deletion logs
SELECT 
  dl.id,
  dl.created_at,
  dl.module,
  'Deleted' as action,
  dl.reference_id,
  dl.description,
  dl.deleted_by as user_id,
  dl.deleted_by_name as user_name,
  dl.deleted_by_email as user_email,
  NULL as old_value,
  NULL as new_value
FROM deletion_log dl

UNION ALL

-- Vehicle inspections
SELECT 
  vi.id,
  vi.created_at,
  'Inspection' as module,
  CASE 
    WHEN vi.status = 'Pending' THEN 'Inspection Submitted'
    WHEN vi.status = 'Approved' THEN 'Inspection Approved'
    WHEN vi.status = 'Rejected' THEN 'Inspection Rejected'
    ELSE 'Inspection Created'
  END as action,
  v.vehicle_number as reference_id,
  CONCAT('Inspection for ', v.vehicle_number, ' by ', d.full_name) as description,
  vi.created_by as user_id,
  prof.full_name as user_name,
  prof.email as user_email,
  NULL as old_value,
  vi.status as new_value
FROM vehicle_inspections vi
LEFT JOIN vehicles v ON vi.vehicle_id = v.id
LEFT JOIN drivers d ON vi.driver_id = d.id
LEFT JOIN profiles prof ON vi.created_by = prof.id

UNION ALL

-- Incidents
SELECT 
  i.id,
  i.created_at,
  'Incident' as module,
  'Incident Reported' as action,
  COALESCE(i.incident_number, CONCAT('INC-', TO_CHAR(i.created_at, 'YYYY-MM-DD'), '-', SUBSTRING(i.id::text, 1, 8))) as reference_id,
  CONCAT('Incident: ', COALESCE(i.incident_type, 'Unknown'), ' - ', COALESCE(i.description, 'No description')) as description,
  i.report_prepared_by as user_id,
  prof.full_name as user_name,
  prof.email as user_email,
  NULL as old_value,
  i.status as new_value
FROM incidents i
LEFT JOIN profiles prof ON i.report_prepared_by = prof.id

UNION ALL

-- Maintenance logs
SELECT 
  ml.id,
  ml.created_at,
  'Maintenance' as module,
  CONCAT('Maintenance: ', ml.maintenance_type) as action,
  v.vehicle_number as reference_id,
  ml.description,
  ml.logged_by as user_id,
  prof.full_name as user_name,
  prof.email as user_email,
  NULL as old_value,
  ml.service_centre as new_value
FROM maintenance_logs ml
LEFT JOIN vehicles v ON ml.vehicle_id = v.id
LEFT JOIN profiles prof ON ml.logged_by = prof.id

UNION ALL

-- Fuel logs
SELECT 
  fl.id,
  fl.logged_at as created_at,
  'Fuel' as module,
  'Fuel Logged' as action,
  v.vehicle_number as reference_id,
  CONCAT(fl.quantity, ' ', fl.unit, ' at ', COALESCE(fl.station_name, 'Unknown station')) as description,
  fl.logged_by as user_id,
  prof.full_name as user_name,
  prof.email as user_email,
  NULL as old_value,
  CONCAT('₦', fl.cost) as new_value
FROM fuel_logs fl
LEFT JOIN vehicles v ON fl.vehicle_id = v.id
LEFT JOIN profiles prof ON fl.logged_by = prof.id

UNION ALL

-- Inventory collections
SELECT 
  ic.id,
  ic.collected_at as created_at,
  'Inventory' as module,
  'Collection Logged' as action,
  ic.item_name as reference_id,
  CONCAT('Collected ', ic.quantity, ' of ', ic.item_name, ' by ', ic.collector_name) as description,
  ic.created_by as user_id,
  prof.full_name as user_name,
  prof.email as user_email,
  NULL as old_value,
  NULL as new_value
FROM inventory_collections ic
LEFT JOIN profiles prof ON ic.created_by = prof.id;
