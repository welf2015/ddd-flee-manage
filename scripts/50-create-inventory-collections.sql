-- Create inventory_collections table for tracking driver collections
CREATE TABLE IF NOT EXISTS inventory_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collector_name TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_description TEXT,
  quantity INTEGER DEFAULT 1,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by UUID REFERENCES profiles(id),
  approved_by_name TEXT, -- Store name for accountability
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE inventory_collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read for authenticated users" ON inventory_collections
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON inventory_collections
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON inventory_collections
  FOR UPDATE TO authenticated USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_inventory_collections_collected_at ON inventory_collections(collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_collections_collector_name ON inventory_collections(collector_name);

-- Update system_activity_log view to include inventory collections
-- First, drop and recreate the view with inventory collections included
DROP VIEW IF EXISTS system_activity_log CASCADE;

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
  CONCAT(i.incident_type, ' Incident') as action,
  i.incident_number as reference_id,
  i.description as description,
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
  CONCAT(ml.maintenance_type, ' Maintenance') as action,
  v.vehicle_number as reference_id,
  ml.description as description,
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
  fl.created_at,
  'Fuel' as module,
  'Fuel Log Created' as action,
  v.vehicle_number as reference_id,
  CONCAT(fl.quantity, ' ', fl.unit, ' at ', fl.station_name) as description,
  fl.logged_by as user_id,
  prof.full_name as user_name,
  prof.email as user_email,
  NULL as old_value,
  fl.cost::text as new_value
FROM fuel_logs fl
LEFT JOIN vehicles v ON fl.vehicle_id = v.id
LEFT JOIN profiles prof ON fl.logged_by = prof.id

UNION ALL

-- Document uploads (procurement)
SELECT 
  pd.id,
  pd.uploaded_at as created_at,
  'Document' as module,
  'Document Uploaded' as action,
  p.procurement_number as reference_id,
  CONCAT(pd.document_type, ': ', pd.document_name) as description,
  pd.uploaded_by as user_id,
  prof.full_name as user_name,
  prof.email as user_email,
  NULL as old_value,
  pd.document_url as new_value
FROM procurement_documents pd
LEFT JOIN procurements p ON pd.procurement_id = p.id
LEFT JOIN profiles prof ON pd.uploaded_by = prof.id

UNION ALL

-- Vehicle onboarding
SELECT 
  vo.id,
  vo.created_at,
  'Onboarding' as module,
  CASE 
    WHEN vo.status = 'Completed' THEN 'Onboarding Completed'
    ELSE 'Onboarding Started'
  END as action,
  vo.vehicle_number as reference_id,
  CONCAT(vo.make, ' ', vo.model, ' ', vo.year) as description,
  vo.assigned_to as user_id,
  prof.full_name as user_name,
  prof.email as user_email,
  NULL as old_value,
  vo.status as new_value
FROM vehicle_onboarding vo
LEFT JOIN profiles prof ON vo.assigned_to = prof.id

UNION ALL

-- Inventory collections
SELECT 
  ic.id,
  ic.collected_at as created_at,
  'Inventory' as module,
  'Item Collected' as action,
  ic.collector_name as reference_id,
  CONCAT(ic.collector_name, ' collected ', ic.item_name, ' (Qty: ', ic.quantity, ')') as description,
  ic.created_by as user_id,
  prof.full_name as user_name,
  prof.email as user_email,
  NULL as old_value,
  CONCAT('Approved by: ', ic.approved_by_name) as new_value
FROM inventory_collections ic
LEFT JOIN profiles prof ON ic.created_by = prof.id

ORDER BY created_at DESC;

-- Create RLS policy for the view
ALTER VIEW system_activity_log SET (security_barrier = true);

-- Grant access to authenticated users
GRANT SELECT ON system_activity_log TO authenticated;
