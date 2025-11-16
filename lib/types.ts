export interface Company {
  id: string
  name: string
  logo_url: string | null
  type: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Department {
  id: string
  company_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface BudgetItem {
  id: string
  company_id: string
  department_id: string | null
  service_name: string
  billing_frequency: "Monthly" | "Yearly" | "Per-Use"
  cost_local: number
  cost_usd: number | null
  currency_symbol: string
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  created_at: string
  updated_at: string
}
