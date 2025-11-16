-- Create companies table with RLS
CREATE TABLE IF NOT EXISTS "01-budgeting-companies" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  type TEXT NOT NULL, -- e.g., "LLC", "Corporation", "Sole Proprietorship"
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "01-budgeting-companies" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own companies"
  ON "01-budgeting-companies" FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own companies"
  ON "01-budgeting-companies" FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own companies"
  ON "01-budgeting-companies" FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own companies"
  ON "01-budgeting-companies" FOR DELETE
  USING (auth.uid() = created_by);

-- Create departments table with RLS
CREATE TABLE IF NOT EXISTS "01-budgeting-departments" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES "01-budgeting-companies"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "01-budgeting-departments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view departments of their companies"
  ON "01-budgeting-departments" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "01-budgeting-companies"
      WHERE id = company_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert departments for their companies"
  ON "01-budgeting-departments" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "01-budgeting-companies"
      WHERE id = company_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update departments of their companies"
  ON "01-budgeting-departments" FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "01-budgeting-companies"
      WHERE id = company_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete departments of their companies"
  ON "01-budgeting-departments" FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "01-budgeting-companies"
      WHERE id = company_id AND created_by = auth.uid()
    )
  );

-- Create budget items table with RLS
CREATE TABLE IF NOT EXISTS "01-budgeting-budget_items" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES "01-budgeting-companies"(id) ON DELETE CASCADE,
  department_id UUID REFERENCES "01-budgeting-departments"(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  billing_frequency TEXT NOT NULL, -- "Monthly", "Yearly", "Per-Use"
  cost_local NUMERIC(12, 2) NOT NULL,
  cost_usd NUMERIC(12, 2),
  currency_symbol TEXT DEFAULT '₦',
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "01-budgeting-budget_items" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budget items of their companies"
  ON "01-budgeting-budget_items" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "01-budgeting-companies"
      WHERE id = company_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert budget items for their companies"
  ON "01-budgeting-budget_items" FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM "01-budgeting-companies"
      WHERE id = company_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update budget items of their companies"
  ON "01-budgeting-budget_items" FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "01-budgeting-companies"
      WHERE id = company_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete budget items of their companies"
  ON "01-budgeting-budget_items" FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "01-budgeting-companies"
      WHERE id = company_id AND created_by = auth.uid()
    )
  );

-- Create user profiles table
CREATE TABLE IF NOT EXISTS "01-budgeting-profiles" (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE "01-budgeting-profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON "01-budgeting-profiles" FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON "01-budgeting-profiles" FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON "01-budgeting-profiles" FOR UPDATE
  USING (auth.uid() = id);

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_budgeting_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO "01-budgeting-profiles" (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', null)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_budgeting ON auth.users;

CREATE TRIGGER on_auth_user_created_budgeting
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_budgeting_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_budgeting_companies_created_by ON "01-budgeting-companies"(created_by);
CREATE INDEX IF NOT EXISTS idx_budgeting_departments_company_id ON "01-budgeting-departments"(company_id);
CREATE INDEX IF NOT EXISTS idx_budgeting_budget_items_company_id ON "01-budgeting-budget_items"(company_id);
CREATE INDEX IF NOT EXISTS idx_budgeting_budget_items_department_id ON "01-budgeting-budget_items"(department_id);
