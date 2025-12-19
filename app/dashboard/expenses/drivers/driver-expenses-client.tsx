"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Wallet, TrendingUp } from "lucide-react"
import useSWR from "swr"
import DriverTransactionsTab from "./driver-transactions-tab"
import DriversListTab from "./drivers-list-tab"
import AddDriverTopupDialog from "@/components/driver-spending/add-driver-topup-dialog"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type DriverExpensesClientProps = {
  initialDrivers?: any[]
  initialTransactions?: any[]
  initialSummary?: {
    totalBalance: number
    weeklySpending: number
  }
}

export default function DriverExpensesClient({
  initialDrivers = [],
  initialTransactions = [],
  initialSummary = { totalBalance: 0, weeklySpending: 0 },
}: DriverExpensesClientProps) {
  const [showTopupDialog, setShowTopupDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  // Fetch summary data with SWR - use initial data from server, then revalidate
  const { data: summary = initialSummary } = useSWR(
    "/api/driver-spending/summary",
    fetcher,
    {
      fallbackData: initialSummary,
      revalidateOnMount: false, // Use initial data immediately
      refreshInterval: 5000, // Refresh every 5 seconds
    },
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Driver Spending Management</h1>
          <p className="text-sm text-muted-foreground">Track and manage driver spending accounts and allowances</p>
        </div>
        <Button onClick={() => setShowTopupDialog(true)} className="bg-accent hover:bg-accent/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Top-up
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spending Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{summary?.totalBalance?.toLocaleString() || "0"}</div>
            <p className="text-xs text-muted-foreground">Across all drivers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{summary?.weeklySpending?.toLocaleString() || "0"}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="drivers">By Driver</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <DriverTransactionsTab initialTransactions={initialTransactions} />
        </TabsContent>

        <TabsContent value="drivers" className="mt-6">
          <DriversListTab initialDrivers={initialDrivers} />
        </TabsContent>
      </Tabs>

      {/* Add Top-up Dialog */}
      <AddDriverTopupDialog open={showTopupDialog} onOpenChange={setShowTopupDialog} />
    </div>
  )
}
