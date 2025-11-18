-- Onboarding Checklist Categories (configurable in settings)
CREATE TABLE IF NOT EXISTS onboarding_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Onboarding Checklist Items (configurable in settings)
CREATE TABLE IF NOT EXISTS onboarding_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES onboarding_categories(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle Onboarding (tracks vehicles in onboarding process)
CREATE TABLE IF NOT EXISTS vehicle_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_id UUID REFERENCES procurements(id),
  vehicle_number TEXT,
  vehicle_type TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  status TEXT DEFAULT 'In Progress', -- 'In Progress', 'Completed'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle Onboarding Checklist Progress (tracks completion of items)
CREATE TABLE IF NOT EXISTS vehicle_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id UUID NOT NULL REFERENCES vehicle_onboarding(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES onboarding_checklist_items(id),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES profiles(id),
  notes TEXT,
  document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE onboarding_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read for authenticated users" ON onboarding_categories FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON onboarding_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON onboarding_categories FOR UPDATE USING (true);

CREATE POLICY "Enable read for authenticated users" ON onboarding_checklist_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON onboarding_checklist_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON onboarding_checklist_items FOR UPDATE USING (true);

CREATE POLICY "Enable read for authenticated users" ON vehicle_onboarding FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON vehicle_onboarding FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON vehicle_onboarding FOR UPDATE USING (true);

CREATE POLICY "Enable read for authenticated users" ON vehicle_onboarding_progress FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON vehicle_onboarding_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON vehicle_onboarding_progress FOR UPDATE USING (true);

-- Insert default onboarding categories
INSERT INTO onboarding_categories (name, description, order_index) VALUES
  ('Documentation', 'Vehicle registration and legal documents', 1),
  ('Insurance', 'Insurance policies and coverage', 2),
  ('Technical Inspection', 'Vehicle inspection and certification', 3),
  ('Fleet Integration', 'System setup and tagging', 4)
ON CONFLICT DO NOTHING;

-- Insert default checklist items
INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT 
  (SELECT id FROM onboarding_categories WHERE name = 'Documentation'),
  item_name,
  description,
  is_required,
  order_index
FROM (VALUES
  ('Vehicle Registration Certificate', 'Complete vehicle registration with relevant authority', true, 1),
  ('Proof of Ownership', 'Original purchase invoice or transfer documents', true, 2),
  ('Tax Clearance', 'Vehicle tax payment receipt', true, 3),
  ('Import Documents', 'Customs clearance and import permits (if applicable)', false, 4)
) AS t(item_name, description, is_required, order_index)
ON CONFLICT DO NOTHING;

INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT 
  (SELECT id FROM onboarding_categories WHERE name = 'Insurance'),
  item_name,
  description,
  is_required,
  order_index
FROM (VALUES
  ('Comprehensive Insurance Policy', 'Full coverage insurance document', true, 1),
  ('Third-Party Insurance', 'Minimum required third-party coverage', true, 2),
  ('Goods-in-Transit Insurance', 'Coverage for transported goods', false, 3)
) AS t(item_name, description, is_required, order_index)
ON CONFLICT DO NOTHING;

INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT 
  (SELECT id FROM onboarding_categories WHERE name = 'Technical Inspection'),
  item_name,
  description,
  is_required,
  order_index
FROM (VALUES
  ('Roadworthiness Certificate', 'Valid road safety inspection certificate', true, 1),
  ('Emission Test', 'Environmental compliance certificate', true, 2),
  ('Weight Certificate', 'Official weight measurement document', false, 3),
  ('Technical Assessment', 'Internal mechanical inspection report', true, 4)
) AS t(item_name, description, is_required, order_index)
ON CONFLICT DO NOTHING;

INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT 
  (SELECT id FROM onboarding_categories WHERE name = 'Fleet Integration'),
  item_name,
  description,
  is_required,
  order_index
FROM (VALUES
  ('Fleet Number Assignment', 'Assign unique fleet identification number', true, 1),
  ('GPS Tracker Installation', 'Install and activate tracking device', true, 2),
  ('System Registration', 'Add vehicle to fleet management system', true, 3),
  ('Photo Documentation', 'Take vehicle photos for records', true, 4)
) AS t(item_name, description, is_required, order_index)
ON CONFLICT DO NOTHING;

-- Update procurements table to add onboarding_id
ALTER TABLE procurements ADD COLUMN IF NOT EXISTS onboarding_id UUID REFERENCES vehicle_onboarding(id);
