-- Add missing columns for enhanced incident reporting
ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS immediate_action_taken TEXT,
ADD COLUMN IF NOT EXISTS downtime BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS workshop_name TEXT,
ADD COLUMN IF NOT EXISTS additional_remarks TEXT,
ADD COLUMN IF NOT EXISTS resolved_by_name TEXT;

-- Ensure other enhanced fields exist (in case script 17 wasn't run or completed)
ALTER TABLE incidents
ADD COLUMN IF NOT EXISTS incident_type TEXT CHECK (incident_type IN ('Accident', 'Breakdown', 'Theft', 'Other')),
ADD COLUMN IF NOT EXISTS incident_time TIME,
ADD COLUMN IF NOT EXISTS injuries_damages TEXT,
ADD COLUMN IF NOT EXISTS third_parties_involved TEXT,
ADD COLUMN IF NOT EXISTS witnesses TEXT,
ADD COLUMN IF NOT EXISTS tow_service_contacted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tow_service_details TEXT,
ADD COLUMN IF NOT EXISTS police_contacted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS police_reference TEXT,
ADD COLUMN IF NOT EXISTS support_notified TEXT,
ADD COLUMN IF NOT EXISTS replacement_vehicle_id UUID REFERENCES vehicles(id),
ADD COLUMN IF NOT EXISTS insurance_claim_filed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS insurance_reference TEXT,
ADD COLUMN IF NOT EXISTS vehicle_towed_to TEXT,
ADD COLUMN IF NOT EXISTS repairs_authorized_by TEXT,
ADD COLUMN IF NOT EXISTS total_amount_spent DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS date_returned_to_service DATE,
ADD COLUMN IF NOT EXISTS report_prepared_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS final_comments TEXT,
ADD COLUMN IF NOT EXISTS status TEXT;

-- Update status check constraint if needed
ALTER TABLE incidents DROP CONSTRAINT IF EXISTS incidents_status_check;
ALTER TABLE incidents ADD CONSTRAINT incidents_status_check CHECK (status IN ('Open', 'Closed', 'Insurance', 'Tow', 'Resolved'));
