-- Add UPDATE and DELETE RLS policies for expense_transactions
CREATE POLICY "Allow MD and ED to update expense transactions"
ON expense_transactions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('MD', 'ED')
  )
);

CREATE POLICY "Allow MD and ED to delete expense transactions"
ON expense_transactions FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('MD', 'ED')
  )
);

-- Create system_settings table for fuel rate and other settings
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  updated_by uuid REFERENCES profiles(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for system_settings
CREATE POLICY "Allow all authenticated users to read system settings"
ON system_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow MD and ED to update system settings"
ON system_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('MD', 'ED')
  )
);

-- Insert default fuel rate (₦1,019 per liter as example)
INSERT INTO system_settings (setting_key, setting_value)
VALUES ('fuel_rate_per_liter', '{"amount": 1019, "currency": "NGN"}')
ON CONFLICT (setting_key) DO NOTHING;
