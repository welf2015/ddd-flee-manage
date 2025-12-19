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

export default function DriverExpensesClient() {
  const [showTopupDialog, setShowTopupDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  // Fetch summary data
  const { data: summary } = useSWR("/api/driver-spending/summary", fetcher, { refreshInterval: 5000 })

  return (
    <div className="space-y-6">
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

      {/* Add Top-up Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowTopupDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Top-up
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="drivers">By Driver</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <DriverTransactionsTab />
        </TabsContent>

        <TabsContent value="drivers" className="mt-6">
          <DriversListTab />
        </TabsContent>
      </Tabs>

      {/* Add Top-up Dialog */}
      <AddDriverTopupDialog open={showTopupDialog} onOpenChange={setShowTopupDialog} />
    </div>
  )
}
