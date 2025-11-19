-- Add new columns to inventory_parts table for spare parts tracking
ALTER TABLE inventory_parts 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS applicable_vehicle_type TEXT DEFAULT 'All',
ADD COLUMN IF NOT EXISTS supplier_brand TEXT;

-- Add comment for clarity
COMMENT ON COLUMN inventory_parts.category IS 'Part category (e.g., Lubricant, Engine, Brake System)';
COMMENT ON COLUMN inventory_parts.applicable_vehicle_type IS 'Vehicle types this part applies to (e.g., All, Cars & Trucks, Motorbikes)';
COMMENT ON COLUMN inventory_parts.supplier_brand IS 'Supplier or brand name for the part';
