-- Inventory Management Tables

CREATE TABLE IF NOT EXISTS inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES inventory_categories(id),
  description TEXT,
  unit_price NUMERIC,
  reorder_level INTEGER DEFAULT 5,
  current_stock INTEGER DEFAULT 0,
  location TEXT,
  supplier_id UUID REFERENCES vendors(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID NOT NULL REFERENCES inventory_parts(id),
  transaction_type TEXT NOT NULL, -- 'IN', 'OUT', 'RETURN'
  quantity INTEGER NOT NULL,
  reference_id TEXT, -- booking_id or incident_id
  reference_type TEXT, -- 'booking', 'maintenance', 'incident'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID NOT NULL REFERENCES inventory_parts(id),
  adjustment_reason TEXT,
  quantity_change INTEGER,
  previous_stock INTEGER,
  new_stock INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read for all" ON inventory_categories FOR SELECT USING (true);
CREATE POLICY "Enable read for all" ON inventory_parts FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated" ON inventory_parts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated" ON inventory_parts FOR UPDATE USING (true);

CREATE POLICY "Enable read for all" ON inventory_transactions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated" ON inventory_transactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for all" ON stock_adjustments FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated" ON stock_adjustments FOR INSERT WITH CHECK (true);
