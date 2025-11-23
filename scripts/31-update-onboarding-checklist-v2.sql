-- Disable RLS to allow deletion
ALTER TABLE vehicle_onboarding_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_checklist_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_categories DISABLE ROW LEVEL SECURITY;

-- Clear existing data (clearing progress first due to foreign key constraints)
DELETE FROM vehicle_onboarding_progress;
DELETE FROM onboarding_checklist_items;
DELETE FROM onboarding_categories;

-- Re-enable RLS
ALTER TABLE vehicle_onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_categories ENABLE ROW LEVEL SECURITY;

-- Insert New Categories
WITH 
cat_docs AS (INSERT INTO onboarding_categories (name, description, order_index) VALUES ('Documentation & Verification', 'Legal documents and vehicle verification', 1) RETURNING id),
cat_safety AS (INSERT INTO onboarding_categories (name, description, order_index) VALUES ('Safety', 'Safety equipment', 2) RETURNING id),
cat_acc AS (INSERT INTO onboarding_categories (name, description, order_index) VALUES ('Accessories', 'In-car accessories', 3) RETURNING id),
cat_brand AS (INSERT INTO onboarding_categories (name, description, order_index) VALUES ('Branding', 'Vehicle branding', 4) RETURNING id),
cat_rep AS (INSERT INTO onboarding_categories (name, description, order_index) VALUES ('Driver & Representative', 'Driver requirements', 5) RETURNING id),
cat_tools AS (INSERT INTO onboarding_categories (name, description, order_index) VALUES ('Tools & Devices', 'Tracking and tools', 6) RETURNING id)

-- Insert Checklist Items
INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT id, item_name, description, is_required, order_index FROM cat_docs CROSS JOIN (VALUES
  ('Certificate of Ownership', 'Proof of ownership', true, 1),
  ('Vehicle Registration', 'Valid registration', true, 2),
  ('Sworn Affidavit', 'Legal affidavit', true, 3),
  ('Parking Permit', 'Valid parking permit', true, 4),
  ('Handbook/SOP', 'Standard Operating Procedures', true, 5),
  ('Vehicle Identification Number', 'VIN verification', true, 6),
  ('Chassis Number', 'Chassis number verification', true, 7),
  ('Engine Number', 'Engine number verification', true, 8),
  ('Vehicle Color', 'Color verification', true, 9)
) AS t(item_name, description, is_required, order_index);

INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT (SELECT id FROM onboarding_categories WHERE name = 'Safety'), item_name, description, is_required, order_index FROM (VALUES
  ('Reflective Jacket', 'Safety jacket present', true, 1)
) AS t(item_name, description, is_required, order_index);

INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT (SELECT id FROM onboarding_categories WHERE name = 'Accessories'), item_name, description, is_required, order_index FROM (VALUES
  ('Car Charger', 'Functional', true, 1),
  ('Phone Stand', 'Installed', true, 2),
  ('Car Mat', 'Present', true, 3),
  ('Box of Tissue', 'Present', true, 4)
) AS t(item_name, description, is_required, order_index);

INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT (SELECT id FROM onboarding_categories WHERE name = 'Branding'), item_name, description, is_required, order_index FROM (VALUES
  ('Fleet ID', 'Vehicle fleet number', true, 1)
) AS t(item_name, description, is_required, order_index);

INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT (SELECT id FROM onboarding_categories WHERE name = 'Driver & Representative'), item_name, description, is_required, order_index FROM (VALUES
  ('Driver Training', 'Completed training', true, 1),
  ('Driver Uniform', 'Issued and worn', true, 2)
) AS t(item_name, description, is_required, order_index);

INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT (SELECT id FROM onboarding_categories WHERE name = 'Tools & Devices'), item_name, description, is_required, order_index FROM (VALUES
  ('Tracker', 'Installed and active', true, 1)
) AS t(item_name, description, is_required, order_index);
