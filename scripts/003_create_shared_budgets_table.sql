-- Create shared budgets table
CREATE TABLE IF NOT EXISTS "01-budgeting-shared_budgets" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES "01-budgeting-companies"(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  year INTEGER NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE "01-budgeting-shared_budgets" ENABLE ROW LEVEL SECURITY;

-- Users can view their own shared budgets
CREATE POLICY "Users can view their own shared budgets"
  ON "01-budgeting-shared_budgets" FOR SELECT
  USING (auth.uid() = created_by);

-- Users can create shared budgets for their companies
CREATE POLICY "Users can create shared budgets"
  ON "01-budgeting-shared_budgets" FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM "01-budgeting-companies"
      WHERE id = company_id AND created_by = auth.uid()
    )
  );

-- Users can delete their own shared budgets
CREATE POLICY "Users can delete their own shared budgets"
  ON "01-budgeting-shared_budgets" FOR DELETE
  USING (auth.uid() = created_by);

-- Public can view shared budgets by token
CREATE POLICY "Public can view shared budgets by token"
  ON "01-budgeting-shared_budgets" FOR SELECT
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shared_budgets_token ON "01-budgeting-shared_budgets"(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_budgets_company ON "01-budgeting-shared_budgets"(company_id);
