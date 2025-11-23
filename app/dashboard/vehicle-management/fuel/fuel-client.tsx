"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Fuel, Zap, TrendingUp, TrendingDown } from 'lucide-react'
import { useState } from "react"
import { FuelLogsTable } from "@/components/fuel/fuel-logs-table"
import { LogFuelDialog } from "@/components/fuel/log-fuel-dialog"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

export function FuelClient() {
  const [showLogFuel, setShowLogFuel] = useState(false)
  const supabase = createClient()

  const { data: fuelStats, mutate } = useSWR("fuel-stats", async () => {
    const { data } = await supabase.from("fuel_logs").select("*")
    const total = data?.reduce((sum, log) => sum + (log.cost || 0), 0) || 0
    
    // Calculate weekly spending (last 7 days)
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisWeek = data?.filter(log => {
      const logDate = new Date(log.logged_at)
      return logDate >= weekAgo
    }) || []
    const thisWeekTotal = thisWeek.reduce((sum, log) => sum + (log.cost || 0), 0)
    
    const avgCost = data && data.length > 0 ? total / data.length : 0

    return {
      totalSpent: total,
      thisWeekSpent: thisWeekTotal,
      totalLogs: data?.length || 0,
      avgCostPerFill: avgCost,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fuel & Charging</h1>
          <p className="text-muted-foreground">Track fuel consumption and charging for your fleet</p>
        </div>
        <Button onClick={() => setShowLogFuel(true)} className="bg-accent hover:bg-accent/90">
          <Plus className="h-4 w-4 mr-2" />
          Log Fuel/Charge
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{fuelStats?.totalSpent.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{fuelStats?.thisWeekSpent.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Current week spending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fuelStats?.totalLogs || 0}</div>
            <p className="text-xs text-muted-foreground">Fuel/charge entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Per Fill</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{fuelStats?.avgCostPerFill.toFixed(0) || 0}</div>
            <p className="text-xs text-muted-foreground">Average cost</p>
          </CardContent>
        </Card>
      </div>

      <FuelLogsTable onUpdate={() => mutate()} />

      {showLogFuel && (
        <LogFuelDialog
          open={showLogFuel}
          onOpenChange={setShowLogFuel}
          onSuccess={() => {
            mutate()
            setShowLogFuel(false)
          }}
        />
      )}
    </div>
  )
}
