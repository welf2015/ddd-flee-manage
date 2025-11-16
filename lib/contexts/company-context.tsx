"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Company } from "@/lib/types"

interface CompanyContextType {
  companies: Company[]
  selectedCompany: Company | null
  setSelectedCompany: (company: Company | null) => void
  refreshCompanies: () => Promise<void>
  isLoading: boolean
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshCompanies = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setCompanies([])
      setSelectedCompany(null)
      setIsLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("01-budgeting-companies")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setCompanies(data)
      // Auto-select first company if none selected
      if (!selectedCompany && data.length > 0) {
        setSelectedCompany(data[0])
        localStorage.setItem("selectedCompanyId", data[0].id)
      }
    }
    setIsLoading(false)
  }

  useEffect(() => {
    refreshCompanies()

    // Restore selected company from localStorage
    const savedCompanyId = localStorage.getItem("selectedCompanyId")
    if (savedCompanyId) {
      const company = companies.find((c) => c.id === savedCompanyId)
      if (company) {
        setSelectedCompany(company)
      }
    }
  }, [])

  useEffect(() => {
    if (selectedCompany) {
      localStorage.setItem("selectedCompanyId", selectedCompany.id)
    }
  }, [selectedCompany])

  return (
    <CompanyContext.Provider
      value={{
        companies,
        selectedCompany,
        setSelectedCompany,
        refreshCompanies,
        isLoading,
      }}
    >
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider")
  }
  return context
}
