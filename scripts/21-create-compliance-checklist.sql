-- Create comprehensive compliance checklist table
CREATE TABLE IF NOT EXISTS vehicle_compliance_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  
  -- Compliance items with their status
  proof_of_ownership TEXT CHECK (proof_of_ownership IN ('Yes', 'No', 'NA')),
  proof_of_ownership_remarks TEXT,
  proof_of_ownership_issue_date DATE,
  proof_of_ownership_expiry_date DATE,
  
  vehicle_insurance TEXT CHECK (vehicle_insurance IN ('Yes', 'No', 'NA')),
  vehicle_insurance_remarks TEXT,
  vehicle_insurance_issue_date DATE,
  vehicle_insurance_expiry_date DATE,
  
  vehicle_license TEXT CHECK (vehicle_license IN ('Yes', 'No', 'NA')),
  vehicle_license_remarks TEXT,
  vehicle_license_issue_date DATE,
  vehicle_license_expiry_date DATE,
  
  customs_documents TEXT CHECK (customs_documents IN ('Yes', 'No', 'NA')),
  customs_documents_remarks TEXT,
  customs_documents_issue_date DATE,
  customs_documents_expiry_date DATE,
  
  number_plate TEXT CHECK (number_plate IN ('Yes', 'No', 'NA')),
  number_plate_remarks TEXT,
  number_plate_issue_date DATE,
  number_plate_expiry_date DATE,
  
  road_worthiness TEXT CHECK (road_worthiness IN ('Yes', 'No', 'NA')),
  road_worthiness_remarks TEXT,
  road_worthiness_issue_date DATE,
  road_worthiness_expiry_date DATE,
  
  hackney_permit TEXT CHECK (hackney_permit IN ('Yes', 'No', 'NA')),
  hackney_permit_remarks TEXT,
  hackney_permit_issue_date DATE,
  hackney_permit_expiry_date DATE,
  
  cmr_registration TEXT CHECK (cmr_registration IN ('Yes', 'No', 'NA')),
  cmr_registration_remarks TEXT,
  cmr_registration_issue_date DATE,
  cmr_registration_expiry_date DATE,
  
  local_govt_permit TEXT CHECK (local_govt_permit IN ('Yes', 'No', 'NA')),
  local_govt_permit_remarks TEXT,
  local_govt_permit_issue_date DATE,
  local_govt_permit_expiry_date DATE,
  
  npa_registration TEXT CHECK (npa_registration IN ('Yes', 'No', 'NA')),
  npa_registration_remarks TEXT,
  npa_registration_issue_date DATE,
  npa_registration_expiry_date DATE,
  
  heavy_duty_permit TEXT CHECK (heavy_duty_permit IN ('Yes', 'No', 'NA')),
  heavy_duty_permit_remarks TEXT,
  heavy_duty_permit_issue_date DATE,
  heavy_duty_permit_expiry_date DATE,
  
  tt_permit TEXT CHECK (tt_permit IN ('Yes', 'No', 'NA')),
  tt_permit_remarks TEXT,
  tt_permit_issue_date DATE,
  tt_permit_expiry_date DATE,
  
  commercial_parking TEXT CHECK (commercial_parking IN ('Yes', 'No', 'NA')),
  commercial_parking_remarks TEXT,
  commercial_parking_issue_date DATE,
  commercial_parking_expiry_date DATE,
  
  cdl_license TEXT CHECK (cdl_license IN ('Yes', 'No', 'NA')),
  cdl_license_remarks TEXT,
  cdl_license_issue_date DATE,
  cdl_license_expiry_date DATE,
  
  driver_license TEXT CHECK (driver_license IN ('Yes', 'No', 'NA')),
  driver_license_remarks TEXT,
  driver_license_issue_date DATE,
  driver_license_expiry_date DATE,
  
  lasdri_card TEXT CHECK (lasdri_card IN ('Yes', 'No', 'NA')),
  lasdri_card_remarks TEXT,
  lasdri_card_issue_date DATE,
  lasdri_card_expiry_date DATE,
  
  lasrra_card TEXT CHECK (lasrra_card IN ('Yes', 'No', 'NA')),
  lasrra_card_remarks TEXT,
  lasrra_card_issue_date DATE,
  lasrra_card_expiry_date DATE,
  
  medical_cert TEXT CHECK (medical_cert IN ('Yes', 'No', 'NA')),
  medical_cert_remarks TEXT,
  medical_cert_issue_date DATE,
  medical_cert_expiry_date DATE,
  
  fire_extinguisher TEXT CHECK (fire_extinguisher IN ('Yes', 'No', 'NA')),
  fire_extinguisher_remarks TEXT,
  fire_extinguisher_issue_date DATE,
  fire_extinguisher_expiry_date DATE,
  
  reflective_triangles TEXT CHECK (reflective_triangles IN ('Yes', 'No', 'NA')),
  reflective_triangles_remarks TEXT,
  
  jumpstart_cables TEXT CHECK (jumpstart_cables IN ('Yes', 'No', 'NA')),
  jumpstart_cables_remarks TEXT,
  
  seatbelts TEXT CHECK (seatbelts IN ('Yes', 'No', 'NA')),
  seatbelts_remarks TEXT,
  
  spare_tire TEXT CHECK (spare_tire IN ('Yes', 'No', 'NA')),
  spare_tire_remarks TEXT,
  
  jack_spanner TEXT CHECK (jack_spanner IN ('Yes', 'No', 'NA')),
  jack_spanner_remarks TEXT,
  
  first_aid_kit TEXT CHECK (first_aid_kit IN ('Yes', 'No', 'NA')),
  first_aid_kit_remarks TEXT,
  first_aid_kit_expiry_date DATE,
  
  phone_usage TEXT CHECK (phone_usage IN ('Yes', 'No', 'NA')),
  phone_usage_remarks TEXT,
  
  speed_limit TEXT CHECK (speed_limit IN ('Yes', 'No', 'NA')),
  speed_limit_remarks TEXT,
  
  pretrip_check TEXT CHECK (pretrip_check IN ('Yes', 'No', 'NA')),
  pretrip_check_remarks TEXT,
  
  posttrip_check TEXT CHECK (posttrip_check IN ('Yes', 'No', 'NA')),
  posttrip_check_remarks TEXT,
  
  violations_logged TEXT CHECK (violations_logged IN ('Yes', 'No', 'NA')),
  violations_logged_remarks TEXT,
  
  -- Audit fields
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(vehicle_id)
);

-- Enable RLS
ALTER TABLE vehicle_compliance_checklist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read for authenticated users" ON vehicle_compliance_checklist
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON vehicle_compliance_checklist
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON vehicle_compliance_checklist
  FOR UPDATE TO authenticated USING (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_compliance_checklist_vehicle 
  ON vehicle_compliance_checklist(vehicle_id);
