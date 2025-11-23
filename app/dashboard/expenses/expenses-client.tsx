"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import useSWR from "swr"
import { formatCurrency } from "@/lib/utils"
import { FuelTab } from "./fuel-tab"
import { TicketingTab } from "./ticketing-tab"
import { AllowanceTab } from "./allowance-tab"
import { AddTopupDialog } from "./add-topup-dialog"
import { FuelMeter } from "./fuel-meter"
import { getWeeklyExpenses, getPrepaidAccounts } from "@/app/actions/expenses"

type ExpensesClientProps = {
  initialAccounts?: any[]
}

export function ExpensesClient({ initialAccounts = [] }: ExpensesClientProps) {
  const [showTopupDialog, setShowTopupDialog] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("fuel")
  const supabase = createClient()

  // Get all prepaid accounts - use initial data from server, then revalidate
  const { data: accounts = initialAccounts } = useSWR(
    "prepaid-accounts",
    async () => {
      const { data } = await getPrepaidAccounts()
      return data || []
    },
    {
      fallbackData: initialAccounts,
      revalidateOnMount: false, // Use initial data immediately
    },
  )

  // Get weekly expenses only for active tab (lazy load)
  const { data: activeWeeklyExpenses = 0 } = useSWR(
    `weekly-${activeTab}-expenses`,
    async () => {
      const { getWeeklyExpenses } = await import("@/app/actions/expenses")
      const expenseType = activeTab === "fuel" ? "Fuel" : activeTab === "ticketing" ? "Ticketing" : "Allowance"
      const { data } = await getWeeklyExpenses(expenseType)
      return data || 0
    },
  )

  // Calculate balances by type
  const fuelBalance = accounts
    .filter((a: any) => a.vendor?.vendor_type === "Fuel")
    .reduce((sum: number, a: any) => sum + Number(a.current_balance || 0), 0)

  const ticketingBalance = accounts
    .filter((a: any) => a.vendor?.vendor_type === "Ticketing")
    .reduce((sum: number, a: any) => sum + Number(a.current_balance || 0), 0)

  const allowanceBalance = accounts
    .filter((a: any) => a.vendor?.vendor_type === "Allowance")
    .reduce((sum: number, a: any) => sum + Number(a.current_balance || 0), 0)

  // Get active tab data
  const activeBalance = activeTab === "fuel" ? fuelBalance : activeTab === "ticketing" ? ticketingBalance : allowanceBalance

  const handleAddTopup = (accountId?: string) => {
    setSelectedAccount(accountId || null)
    setShowTopupDialog(true)
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Expense Management</h1>
          <p className="text-sm text-muted-foreground">Manage prepaid accounts for fuel, ticketing, and allowances</p>
        </div>
      </div>

      {/* Summary Cards - Dynamic based on active tab */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {activeTab === "fuel" ? "Fuel" : activeTab === "ticketing" ? "Ticketing" : "Allowance"} Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(activeBalance, "NGN")}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeBalance < 0 ? "Overdrawn" : "Available"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(activeWeeklyExpenses, "NGN")}
            </div>
            <p className="text-xs text-muted-foreground">Weekly accounting period</p>
          </CardContent>
        </Card>

        {/* Fuel Spending Progress - Only show for fuel tab */}
        {activeTab === "fuel" && (() => {
          const fuelAccount = accounts.find((a: any) => a.vendor?.vendor_type === "Fuel")
          const totalFuelSpent = fuelAccount ? Number(fuelAccount.total_spent || 0) : 0
          const totalDeposited = fuelAccount ? Number(fuelAccount.total_deposited || 0) : 0
          
          return (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fuel Spending Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <FuelMeter totalSpent={totalFuelSpent} totalDeposited={totalDeposited} />
                <p className="text-xs text-muted-foreground mt-2">
                  {formatCurrency(totalFuelSpent, "NGN")} of {formatCurrency(totalDeposited || 0, "NGN")}
                </p>
              </CardContent>
            </Card>
          )
        })()}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="fuel" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fuel">Fuel</TabsTrigger>
          <TabsTrigger value="ticketing">Ticketing</TabsTrigger>
          <TabsTrigger value="allowance">Allowance</TabsTrigger>
        </TabsList>

        <TabsContent value="fuel" className="space-y-4 mt-4">
          <div className="flex justify-end items-center">
            <Button onClick={() => handleAddTopup()} className="bg-accent hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Top-up
            </Button>
          </div>
          <FuelTab onAddTopup={handleAddTopup} initialAccounts={accounts} />
        </TabsContent>

        <TabsContent value="ticketing" className="space-y-4 mt-4">
          <div className="flex justify-end items-center">
            <Button onClick={() => handleAddTopup()} className="bg-accent hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Top-up
            </Button>
          </div>
          <TicketingTab onAddTopup={handleAddTopup} initialAccounts={accounts} />
        </TabsContent>

        <TabsContent value="allowance" className="space-y-4 mt-4">
          <div className="flex justify-end items-center">
            <Button onClick={() => handleAddTopup()} className="bg-accent hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Top-up
            </Button>
          </div>
          <AllowanceTab onAddTopup={handleAddTopup} initialAccounts={accounts} />
        </TabsContent>
      </Tabs>

      {showTopupDialog && (
        <AddTopupDialog
          open={showTopupDialog}
          onOpenChange={setShowTopupDialog}
          accountId={selectedAccount || undefined}
        />
      )}
    </>
  )
}

