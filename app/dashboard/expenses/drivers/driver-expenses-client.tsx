"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Wallet, TrendingUp, DollarSign } from "lucide-react"
import useSWR from "swr"
import DriversListTab from "./drivers-list-tab"
import AddDriverTopupDialog from "@/components/driver-spending/add-driver-topup-dialog"
import WeekFilterSelector from "@/components/driver-spending/week-filter-selector"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type DriverExpensesClientProps = {
  initialDrivers?: any[]
  initialSummary?: {
    totalBalance: number
    weeklySpending: number
    dailySpending?: number
    totalSpent?: number
  }
}
export default function DriverExpensesClient({
  initialDrivers = [],
  initialSummary = { totalBalance: 0, weeklySpending: 0, dailySpending: 0, totalSpent: 0 },
}: DriverExpensesClientProps) {
  const [showTopupDialog, setShowTopupDialog] = useState(false)

  const [selectedWeek, setSelectedWeek] = useState<string>("current")
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  // Fetch summary data with SWR
  const { data: summary = initialSummary, mutate: mutateSummary } = useSWR(
    `/api/driver-spending/summary?week=${selectedWeek}&year=${selectedYear}`,
    fetcher,
    {
      fallbackData: initialSummary,
      revalidateOnMount: false,
      refreshInterval: 30000,
    }
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Driver Spending Management</h1>
          <p className="text-sm text-muted-foreground">Track and manage driver spending accounts and allowances</p>
        </div>
        <div className="flex items-center gap-2">
          <WeekFilterSelector
            selectedWeek={selectedWeek}
            selectedYear={selectedYear}
            onWeekChange={setSelectedWeek}
            onYearChange={setSelectedYear}
          />
          <Button onClick={() => setShowTopupDialog(true)} className="bg-accent hover:bg-accent/90">
            <Plus className="mr-2 h-4 w-4" />
            Add Top-up
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="col-span-1 md:grid-cols-1 border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closing Balance</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${summary?.totalBalance < 0 ? "text-red-600" : "text-primary"}`}>
              ₦{summary?.totalBalance?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current available balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spent Today</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{summary?.dailySpending?.toLocaleString() || "0"}</div>
            <p className="text-xs text-muted-foreground">Total spent today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spent This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{summary?.weeklySpending?.toLocaleString() || "0"}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Drivers List */}
      <div className="mt-6">
        <DriversListTab initialDrivers={initialDrivers} />
      </div>

      {/* Add Top-up Dialog */}
      <AddDriverTopupDialog
        open={showTopupDialog}
        onOpenChange={setShowTopupDialog}
        onSuccess={() => {
          mutateSummary()
        }}
      />
    </div>
  )
}
