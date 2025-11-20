-- Create page permissions table
CREATE TABLE IF NOT EXISTS page_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_name TEXT NOT NULL,
  page_path TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  page_id UUID NOT NULL REFERENCES page_permissions(id) ON DELETE CASCADE,
  can_access BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, page_id)
);

-- Enable RLS
ALTER TABLE page_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read for authenticated users" ON page_permissions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON page_permissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON page_permissions FOR UPDATE USING (true);

CREATE POLICY "Enable read for authenticated users" ON role_permissions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON role_permissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON role_permissions FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON role_permissions FOR DELETE USING (true);

-- Insert default pages
INSERT INTO page_permissions (page_name, page_path, description) VALUES
  ('Dashboard', '/dashboard', 'Main dashboard overview'),
  ('Bookings', '/dashboard/bookings', 'Manage bookings and jobs'),
  ('Vehicle Management', '/dashboard/vehicle-management', 'Vehicle management overview'),
  ('Vehicles', '/dashboard/vehicle-management/vehicles', 'Manage fleet vehicles'),
  ('Onboarding', '/dashboard/vehicle-management/onboarding', 'Vehicle onboarding process'),
  ('Fuel/Charging', '/dashboard/vehicle-management/fuel', 'Fuel and charging logs'),
  ('Feedbacks', '/dashboard/vehicle-management/feedbacks', 'Driver and client feedbacks'),
  ('Compliance', '/dashboard/vehicle-management/compliance', 'Vehicle compliance tracking'),
  ('Inspections', '/dashboard/vehicle-management/inspections', 'Vehicle inspections'),
  ('Incidents', '/dashboard/incidents', 'Incident management'),
  ('Maintenance', '/dashboard/vehicle-management/maintenance', 'Maintenance scheduling'),
  ('Clients', '/dashboard/clients', 'Client management'),
  ('Procurement', '/dashboard/procurement', 'Vehicle procurement'),
  ('Inventory', '/dashboard/inventory', 'Parts inventory management'),
  ('Sales Insights', '/dashboard/sales-insights', 'Sales analytics and insights'),
  ('Reports', '/dashboard/reports', 'Generate reports'),
  ('Accountability', '/dashboard/accountability', 'System activity log'),
  ('Settings', '/dashboard/settings', 'System settings')
ON CONFLICT (page_path) DO NOTHING;

-- Insert default role permissions (Admin has access to everything by default)
INSERT INTO role_permissions (role, page_id, can_access)
SELECT 'Admin', id, true FROM page_permissions
ON CONFLICT (role, page_id) DO NOTHING;
