-- Procurement Management Tables

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  bank_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Clearing Agents table
CREATE TABLE IF NOT EXISTS clearing_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  license_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Procurement table (main procurement orders)
CREATE TABLE IF NOT EXISTS procurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_number TEXT UNIQUE,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  status TEXT DEFAULT 'Negotiation',
  vehicle_type TEXT,
  quantity INTEGER DEFAULT 1,
  initial_quote NUMERIC,
  negotiated_price NUMERIC,
  final_price NUMERIC,
  expected_arrival_date DATE,
  actual_arrival_date DATE,
  clearing_agent_id UUID REFERENCES clearing_agents(id),
  clearing_status TEXT,
  vehicle_id UUID REFERENCES vehicles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id)
);

-- Procurement Documents table
CREATE TABLE IF NOT EXISTS procurement_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_id UUID NOT NULL REFERENCES procurements(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_url TEXT,
  document_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID REFERENCES profiles(id)
);

-- Procurement Updates/Timeline table
CREATE TABLE IF NOT EXISTS procurement_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_id UUID NOT NULL REFERENCES procurements(id) ON DELETE CASCADE,
  action_type TEXT,
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action_by UUID REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE clearing_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_timeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendors
CREATE POLICY "Enable read for authenticated users" ON vendors FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON vendors FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON vendors FOR UPDATE USING (true);

-- RLS Policies for clearing_agents
CREATE POLICY "Enable read for authenticated users" ON clearing_agents FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON clearing_agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON clearing_agents FOR UPDATE USING (true);

-- RLS Policies for procurements
CREATE POLICY "Enable read for authenticated users" ON procurements FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON procurements FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON procurements FOR UPDATE USING (true);

-- RLS Policies for procurement_documents
CREATE POLICY "Enable read for authenticated users" ON procurement_documents FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON procurement_documents FOR INSERT WITH CHECK (true);

-- RLS Policies for procurement_timeline
CREATE POLICY "Enable read for authenticated users" ON procurement_timeline FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON procurement_timeline FOR INSERT WITH CHECK (true);

-- Create sequence for procurement numbers
CREATE SEQUENCE IF NOT EXISTS procurement_sequence START 1;
