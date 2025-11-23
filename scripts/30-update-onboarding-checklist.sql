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
cat_docs AS (INSERT INTO onboarding_categories (name, description, order_index) VALUES ('Vehicle Documentation', 'Required legal and compliance documents', 1) RETURNING id),
cat_ext AS (INSERT INTO onboarding_categories (name, description, order_index) VALUES ('Exterior & Body', 'Exterior condition and bodywork inspection', 2) RETURNING id),
cat_int AS (INSERT INTO onboarding_categories (name, description, order_index) VALUES ('Interior', 'Interior condition and functionality', 3) RETURNING id),
cat_safety AS (INSERT INTO onboarding_categories (name, description, order_index) VALUES ('Safety Equipment', 'Safety gear and compliance items', 4) RETURNING id),
cat_acc AS (INSERT INTO onboarding_categories (name, description, order_index) VALUES ('Accessories & Setup', 'Vehicle accessories and setup items', 5) RETURNING id),
cat_tires AS (INSERT INTO onboarding_categories (name, description, order_index) VALUES ('Tires & Wheels', 'Tire condition and wheel security', 6) RETURNING id),
cat_elec AS (INSERT INTO onboarding_categories (name, description, order_index) VALUES ('Lights & Electrical', 'Lighting and electrical systems', 7) RETURNING id),
cat_engine AS (INSERT INTO onboarding_categories (name, description, order_index) VALUES ('Engine & Fluids', 'Engine operation and fluid levels', 8) RETURNING id),
cat_brake AS (INSERT INTO onboarding_categories (name, description, order_index) VALUES ('Brakes & Suspension', 'Braking and suspension systems', 9) RETURNING id),
cat_steer AS (INSERT INTO onboarding_categories (name, description, order_index) VALUES ('Steering & Control', 'Steering mechanism and alignment', 10) RETURNING id),
cat_perf AS (INSERT INTO onboarding_categories (name, description, order_index) VALUES ('Performance Test', 'Road test performance verification', 11) RETURNING id),
cat_brand AS (INSERT INTO onboarding_categories (name, description, order_index) VALUES ('Branding', 'Company branding and identification', 12) RETURNING id),
cat_rep AS (INSERT INTO onboarding_categories (name, description, order_index) VALUES ('Vehicle Representative', 'Driver and representative assignment details', 13) RETURNING id),
cat_tools AS (INSERT INTO onboarding_categories (name, description, order_index) VALUES ('Vehicle Devices/Tools', 'Tracking and platform registration', 14) RETURNING id)

-- Insert Checklist Items
INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT id, item_name, description, is_required, order_index FROM cat_docs CROSS JOIN (VALUES
  ('Proof of Purchase', 'Invoice or Receipt', true, 1),
  ('Vehicle Sales Agreement', 'Signed sales agreement', true, 2),
  ('Certificate of Ownership', 'Allocation of Title', true, 3),
  ('Customs Documents & Duty', 'Taxes/Levy payments', true, 4),
  ('Vehicle Registration Certificate', 'License', true, 5),
  ('Certificate of Roadworthiness', 'Valid certificate', true, 6),
  ('Insurance Certificate', 'Third Party/Comprehensive', true, 7),
  ('License Plate Number Allocation', 'Plate number assigned', true, 8),
  ('CMR Documents', 'Centre Motor Registry documents', true, 9),
  ('Sworn Affidavit', 'For trucks', false, 10),
  ('Hackney Permit', 'Required for commercial vehicles', true, 11),
  ('Local Government Permit', 'Local permit', true, 12),
  ('NPA Truck Registration', 'For trucks only', false, 13),
  ('T & T Permit', 'Transport and Traffic permit', true, 14),
  ('Commercial Parking Permit', 'If applicable', false, 15),
  ('Commercial Driver License (CDL)', 'Valid CDL for driver', true, 16),
  ('Heavy Duty Permit', 'For heavy duty vehicles', false, 17),
  ('Medical Certification', 'Driver medical cert', true, 18),
  ('Handbook', 'SOPs & Emergency response list (999)', true, 19),
  ('VIN / Chassis No Verification', 'Verify against documents', true, 20),
  ('Engine Number Verification', 'Verify against documents', true, 21),
  ('Colour Verification', 'Verify against documents', true, 22),
  ('Odometer Reading Check', 'Record reading', true, 23),
  ('Fuel Type Verification', 'Verify fuel type', true, 24),
  ('Transmission Type Verification', 'Verify transmission', true, 25),
  ('Document Physical Check', 'All vehicle documents are within the vehicle', true, 26)
) AS t(item_name, description, is_required, order_index);

INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT (SELECT id FROM onboarding_categories WHERE name = 'Exterior & Body'), item_name, description, is_required, order_index FROM (VALUES
  ('Body Condition', 'No dents, cracks, clean paint or damage', true, 1),
  ('Mirrors', 'Side & rear view intact, properly aligned', true, 2),
  ('Windshield & Windows', 'No cracks, clear visibility', true, 3),
  ('Doors & Locks', 'Functioning properly', true, 4),
  ('Tires Check', 'In good condition', true, 5)
) AS t(item_name, description, is_required, order_index);

INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT (SELECT id FROM onboarding_categories WHERE name = 'Interior'), item_name, description, is_required, order_index FROM (VALUES
  ('Cleanliness', 'Interior Clean & Odor-Free', true, 1),
  ('Seat Condition', 'No tears/damage', true, 2),
  ('Seatbelts', 'Operational for all seats', true, 3),
  ('Seats Security', 'Firmly secured and adjustable', true, 4),
  ('Dashboard & Lights', 'Functional', true, 5),
  ('AC/Ventilation', 'Working properly', true, 6)
) AS t(item_name, description, is_required, order_index);

INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT (SELECT id FROM onboarding_categories WHERE name = 'Safety Equipment'), item_name, description, is_required, order_index FROM (VALUES
  ('Fire Extinguisher', 'Present & valid', true, 1),
  ('First Aid Kit', 'Complete', true, 2),
  ('Reflective Triangle & Jackets', 'Available', true, 3)
) AS t(item_name, description, is_required, order_index);

INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT (SELECT id FROM onboarding_categories WHERE name = 'Accessories & Setup'), item_name, description, is_required, order_index FROM (VALUES
  ('Jumper Cables', 'Present', true, 1),
  ('Car Chargers', 'Functional', true, 2),
  ('Charging Cables', 'Present', true, 3),
  ('Steering Wheel Cover', 'Installed', false, 4),
  ('Phone Stand', 'Installed', true, 5),
  ('Car Mats', 'Present', true, 6),
  ('Tissue Box', 'Present', false, 7)
) AS t(item_name, description, is_required, order_index);

INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT (SELECT id FROM onboarding_categories WHERE name = 'Tires & Wheels'), item_name, description, is_required, order_index FROM (VALUES
  ('Tread Depth', 'Adequate (≥2/32inch)', true, 1),
  ('Inflation', 'Properly inflated (no bulges, cuts, or leaks)', true, 2),
  ('Spare Tire', 'Present and in good condition', true, 3),
  ('Wheel Nuts', 'Secure', true, 4)
) AS t(item_name, description, is_required, order_index);

INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT (SELECT id FROM onboarding_categories WHERE name = 'Lights & Electrical'), item_name, description, is_required, order_index FROM (VALUES
  ('Headlights', 'Low & high beam functional', true, 1),
  ('Tail/Brake/Reverse Lights', 'Working', true, 2),
  ('Signals & Hazards', 'Functional', true, 3),
  ('Horn', 'Functioning properly', true, 4),
  ('Wipers & Washer Fluid', 'Operational', true, 5)
) AS t(item_name, description, is_required, order_index);

INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT (SELECT id FROM onboarding_categories WHERE name = 'Engine & Fluids'), item_name, description, is_required, order_index FROM (VALUES
  ('Engine Start', 'Starts smoothly (no unusual noises)', true, 1),
  ('Coolant Level', 'Adequate', true, 2),
  ('Brake Fluid Level', 'Adequate', true, 3),
  ('Transmission Fluid', 'Adequate', true, 4),
  ('Leak Check', 'No visible leaks (coolant, fuel)', true, 5)
) AS t(item_name, description, is_required, order_index);

INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT (SELECT id FROM onboarding_categories WHERE name = 'Brakes & Suspension'), item_name, description, is_required, order_index FROM (VALUES
  ('Brake Response', 'Effective without delay/noise', true, 1),
  ('Parking Brake', 'Holds properly', true, 2),
  ('Suspension', 'Stable (no excessive bouncing/noises)', true, 3)
) AS t(item_name, description, is_required, order_index);

INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT (SELECT id FROM onboarding_categories WHERE name = 'Steering & Control'), item_name, description, is_required, order_index FROM (VALUES
  ('Steering Movement', 'Normal (no excessive play)', true, 1),
  ('Alignment', 'Feels correct (no pulling)', true, 2)
) AS t(item_name, description, is_required, order_index);

INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT (SELECT id FROM onboarding_categories WHERE name = 'Performance Test'), item_name, description, is_required, order_index FROM (VALUES
  ('Acceleration', 'Smooth without hesitation', true, 1),
  ('Engine Noise', 'No abnormal noises during drive', true, 2),
  ('Braking Distance', 'Reasonable and steady', true, 3)
) AS t(item_name, description, is_required, order_index);

INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT (SELECT id FROM onboarding_categories WHERE name = 'Branding'), item_name, description, is_required, order_index FROM (VALUES
  ('LASAA Permit', 'Mobile branding permit', true, 1),
  ('Company Branding', 'Logos, schemes, stickers applied', true, 2),
  ('Branding Vendor', 'Verify vendor', true, 3),
  ('Photo Records', 'Record photos of branding completion', true, 4),
  ('Branding Approval', 'Approved by authorized person', true, 5),
  ('Vehicle Numbering', 'Fleet ID correct', true, 6),
  ('Reflective Stickers', 'Installed', true, 7)
) AS t(item_name, description, is_required, order_index);

INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT (SELECT id FROM onboarding_categories WHERE name = 'Vehicle Representative'), item_name, description, is_required, order_index FROM (VALUES
  ('Driver Assignment', 'Assigned in system', true, 1),
  ('Driver Name Check', 'Verify full name', true, 2),
  ('License Check', 'License No. & Expiry Date', true, 3),
  ('LASDRI Certificate', 'Verified', true, 4),
  ('LASRRA Card', 'Verified', true, 5),
  ('Training', 'Attended', true, 6),
  ('Phone Verification', 'Driver phone number', true, 7),
  ('Uniform/ID', 'Issued', true, 8),
  ('Fuel Card/Tag', 'Activated', true, 9),
  ('Medical & Background', 'Confirmed', true, 10),
  ('Guarantor', 'Details confirmed', true, 11)
) AS t(item_name, description, is_required, order_index);

INSERT INTO onboarding_checklist_items (category_id, item_name, description, is_required, order_index)
SELECT (SELECT id FROM onboarding_categories WHERE name = 'Vehicle Devices/Tools'), item_name, description, is_required, order_index FROM (VALUES
  ('Platform Registration', 'Registered on App/Tracking', true, 1),
  ('Tracking Device', 'Installed', true, 2),
  ('Devices Marked', 'Marked appropriately', true, 3)
) AS t(item_name, description, is_required, order_index);
