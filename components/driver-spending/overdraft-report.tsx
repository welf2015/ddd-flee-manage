"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle } from "lucide-react"

interface OverdrawnDriver {
  driver_id: string
  full_name: string
  phone: string
  status: string
  current_balance: number
  spending_limit: number
  overdraft_amount: number
  is_overdrawn: boolean
  limit_percentage_used: number
  weekly_expenses: number
  daily_expenses: number
  last_transaction_date: string | null
  severity: "critical" | "warning" | "none"
}

interface OverdraftSummary {
  total_system_overdraft: number
  total_drivers_overdrawn: number
  critical_cases: number
  average_overdraft: number
}

export function OverdraftReport() {
  const [summary, setSummary] = useState<OverdraftSummary | null>(null)
  const [drivers, setDrivers] = useState<OverdrawnDriver[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOverdraftData = async () => {
      try {
        const response = await fetch("/api/driver-spending/overdrafts?limit=20")
        const data = await response.json()
        setSummary(data.summary)
        setDrivers(data.overdrawn_drivers || [])
      } catch (error) {
        console.error("[v0] Error fetching overdraft data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOverdraftData()
  }, [])

  if (loading) {
    return <div className="text-center py-8">Loading overdraft data...</div>
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "warning":
        return "bg-yellow-50 text-yellow-900 border-yellow-200"
      default:
        return "bg-green-50 text-green-900 border-green-200"
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "critical":
        return "Critical"
      case "warning":
        return "Warning"
      default:
        return "Clear"
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">System Overdraft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ₦{summary?.total_system_overdraft.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600 mt-1">Total across all drivers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Drivers Overdrawn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_drivers_overdrawn}</div>
            <p className="text-xs text-gray-600 mt-1">Need allowance top-up</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary?.critical_cases}</div>
            <p className="text-xs text-gray-600 mt-1">Overdraft &gt; 50% limit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Overdraft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{summary?.average_overdraft.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">Per overdrawn driver</p>
          </CardContent>
        </Card>
      </div>

      {/* Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Most Overdrawn Drivers</CardTitle>
          <CardDescription>Ranked by overdraft amount - largest first</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Current Balance</TableHead>
                  <TableHead className="text-right">Limit</TableHead>
                  <TableHead className="text-right">Overdraft</TableHead>
                  <TableHead className="text-right">Weekly Spent</TableHead>
                  <TableHead className="text-center">Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No overdrawn drivers
                    </TableCell>
                  </TableRow>
                ) : (
                  drivers.map((driver, index) => (
                    <TableRow key={driver.driver_id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">#{index + 1}</TableCell>
                      <TableCell className="font-medium">{driver.full_name}</TableCell>
                      <TableCell className="text-gray-600">{driver.phone}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${driver.current_balance < 0 ? "text-destructive" : "text-green-600"}`}
                      >
                        ₦{driver.current_balance.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">₦{driver.spending_limit.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold text-destructive">
                        ₦{driver.overdraft_amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">₦{driver.weekly_expenses.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`${getSeverityColor(driver.severity)}`}>
                          {getSeverityLabel(driver.severity)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      {summary && summary.critical_cases > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <CardTitle className="text-yellow-900">Action Required</CardTitle>
                <CardDescription className="text-yellow-800">
                  {summary.critical_cases} driver(s) have critical overdraft levels
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-800">
              Total critical overdraft:{" "}
              <span className="font-bold">
                ₦
                {drivers
                  .filter((d) => d.severity === "critical")
                  .reduce((sum, d) => sum + d.overdraft_amount, 0)
                  .toLocaleString()}
              </span>
            </p>
            <p className="text-sm text-yellow-800 mt-2">
              Recommend immediate allowance top-ups to clear these deficits.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
