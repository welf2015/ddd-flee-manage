-- Add new columns to procurements table for vehicle acquisition checklist
ALTER TABLE procurements
ADD COLUMN IF NOT EXISTS vehicle_make TEXT,
ADD COLUMN IF NOT EXISTS vehicle_model TEXT,
ADD COLUMN IF NOT EXISTS year_of_manufacture INTEGER,
ADD COLUMN IF NOT EXISTS vin_chassis_number TEXT,
ADD COLUMN IF NOT EXISTS engine_number TEXT,
ADD COLUMN IF NOT EXISTS vehicle_color TEXT,
ADD COLUMN IF NOT EXISTS fuel_type TEXT,
ADD COLUMN IF NOT EXISTS transmission_type TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'NGN',
ADD COLUMN IF NOT EXISTS vehicle_arrival_date DATE,
ADD COLUMN IF NOT EXISTS waybill_number TEXT,
ADD COLUMN IF NOT EXISTS shipping_tracking_no TEXT,
-- Added missing columns for shipping workflow
ADD COLUMN IF NOT EXISTS shipping_date DATE,
ADD COLUMN IF NOT EXISTS estimated_delivery_months INTEGER,
ADD COLUMN IF NOT EXISTS condition_on_arrival TEXT,
ADD COLUMN IF NOT EXISTS warranty_details TEXT,
ADD COLUMN IF NOT EXISTS received_by TEXT,
ADD COLUMN IF NOT EXISTS proof_of_purchase_url TEXT,
ADD COLUMN IF NOT EXISTS sales_agreement_url TEXT,
ADD COLUMN IF NOT EXISTS certificate_of_ownership_url TEXT,
ADD COLUMN IF NOT EXISTS clearing_date DATE,
ADD COLUMN IF NOT EXISTS clearing_vendor TEXT,
ADD COLUMN IF NOT EXISTS tdo_obtained BOOLEAN DEFAULT false,
-- Fixed: Using customs_documents as TEXT field for notes (not URL)
ADD COLUMN IF NOT EXISTS customs_documents TEXT,
ADD COLUMN IF NOT EXISTS license_plate_number TEXT,
ADD COLUMN IF NOT EXISTS cmr_documents_url TEXT,
ADD COLUMN IF NOT EXISTS sworn_affidavit_url TEXT,
ADD COLUMN IF NOT EXISTS manufacturer_test_cert_url TEXT,
ADD COLUMN IF NOT EXISTS coc_url TEXT,
ADD COLUMN IF NOT EXISTS idec_waiver_valid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS soncap_form_m_url TEXT,
ADD COLUMN IF NOT EXISTS bill_of_lading_url TEXT,
ADD COLUMN IF NOT EXISTS payment_authorization_url TEXT,
ADD COLUMN IF NOT EXISTS procurement_request_form_url TEXT,
ADD COLUMN IF NOT EXISTS parking_list_url TEXT,
ADD COLUMN IF NOT EXISTS cif_lagos_terms BOOLEAN DEFAULT false;
-- Note: invoice_receipt_url and customs_documents_url already exist in database

-- Add country column to vendors table
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Nigeria';

-- Create procurement inspection checklist table
CREATE TABLE IF NOT EXISTS procurement_inspection_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_id UUID NOT NULL REFERENCES procurements(id) ON DELETE CASCADE,
  exterior_condition TEXT DEFAULT 'Pending',
  exterior_condition_remarks TEXT,
  interior_condition TEXT DEFAULT 'Pending',
  interior_condition_remarks TEXT,
  tires_condition TEXT DEFAULT 'Pending',
  tires_condition_remarks TEXT,
  lights_indicators_horn TEXT DEFAULT 'Pending',
  lights_indicators_horn_remarks TEXT,
  brakes_suspension TEXT DEFAULT 'Pending',
  brakes_suspension_remarks TEXT,
  dashboard_indicators TEXT DEFAULT 'Pending',
  dashboard_indicators_remarks TEXT,
  windows_mirrors_locks TEXT DEFAULT 'Pending',
  windows_mirrors_locks_remarks TEXT,
  ac_ventilation TEXT DEFAULT 'Pending',
  ac_ventilation_remarks TEXT,
  jack_wheel_spanner TEXT DEFAULT 'Pending',
  jack_wheel_spanner_remarks TEXT,
  conducted_by TEXT,
  conducted_by_signature TEXT,
  conducted_date DATE,
  approved_by_name TEXT,
  approved_by_signature TEXT,
  approved_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE procurement_inspection_checklist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating them to avoid conflicts
DROP POLICY IF EXISTS "Enable read for authenticated users" ON procurement_inspection_checklist;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON procurement_inspection_checklist;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON procurement_inspection_checklist;

-- RLS Policies
CREATE POLICY "Enable read for authenticated users" ON procurement_inspection_checklist FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON procurement_inspection_checklist FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON procurement_inspection_checklist FOR UPDATE USING (true);
