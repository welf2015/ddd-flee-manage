"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { getDateRange, getPeriodLabel, type TimePeriod } from "@/lib/report-utils"
import { formatCurrency } from "@/lib/utils"

type DriverSpendingReportProps = {
  timePeriod?: TimePeriod
}

export function DriverSpendingReport({ timePeriod = "weekly" }: DriverSpendingReportProps) {
  const supabase = createClient()
  const { startDateISO } = getDateRange(timePeriod)

  const { data: spendingData = [], isLoading } = useSWR(
    `driver-spending-report-${timePeriod}`,
    async () => {
      // Get all drivers
      const { data: drivers } = await supabase.from("drivers").select("id, full_name, status").order("full_name")

      if (!drivers || drivers.length === 0) {
        return []
      }

      // Get spending accounts
      const { data: accounts } = await supabase
        .from("driver_spending_accounts")
        .select("driver_id, current_balance, spending_limit, total_spent, weekly_spent")

      // Get allowance expenses within time period
      let expensesQuery = supabase
        .from("expense_transactions")
        .select("driver_id, amount, transaction_date")
        .eq("expense_type", "Allowance")
        .not("driver_id", "is", null)

      if (startDateISO) {
        expensesQuery = expensesQuery.gte("transaction_date", startDateISO)
      }

      const { data: expenses } = await expensesQuery

      // Build report data
      const reportData = drivers.map((driver: any) => {
        const account = accounts?.find((a: any) => a.driver_id === driver.id)
        const driverExpenses = expenses?.filter((e: any) => e.driver_id === driver.id) || []

        const periodSpent = driverExpenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)
        const transactionCount = driverExpenses.length

        return {
          id: driver.id,
          name: driver.full_name,
          status: driver.status,
          currentBalance: account?.current_balance || 0,
          spendingLimit: account?.spending_limit || 0,
          periodSpent,
          transactionCount,
          hasAccount: !!account,
        }
      })

      // Sort by period spent (descending)
      return reportData.sort((a: any, b: any) => b.periodSpent - a.periodSpent)
    },
    { refreshInterval: 30000 },
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Active
          </Badge>
        )
      case "Currently on Job":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            On Job
          </Badge>
        )
      case "Assigned to Job":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            Assigned
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getBalanceStatus = (balance: number, limit: number) => {
    if (balance < 0) return <Badge variant="destructive">Negative</Badge>
    if (limit > 0 && balance >= limit) return <Badge variant="default">Full</Badge>
    if (limit > 0 && balance >= limit * 0.8) return <Badge className="bg-yellow-500">Near Limit</Badge>
    return <Badge variant="secondary">OK</Badge>
  }

  // Calculate totals
  const totalPeriodSpent = spendingData.reduce((sum: number, d: any) => sum + d.periodSpent, 0)
  const totalTransactions = spendingData.reduce((sum: number, d: any) => sum + d.transactionCount, 0)
  const driversWithSpending = spendingData.filter((d: any) => d.periodSpent > 0).length

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total {getPeriodLabel(timePeriod)} Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPeriodSpent, "NGN")}</div>
            <p className="text-xs text-muted-foreground">{totalTransactions} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Spenders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{driversWithSpending}</div>
            <p className="text-xs text-muted-foreground">of {spendingData.length} drivers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Spending Per Driver</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(driversWithSpending > 0 ? totalPeriodSpent / driversWithSpending : 0, "NGN")}
            </div>
            <p className="text-xs text-muted-foreground">Among active spenders</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Spending Details</CardTitle>
          <CardDescription>{getPeriodLabel(timePeriod)} - Allowance spending by driver</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading spending data...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>{getPeriodLabel(timePeriod)} Spent</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Current Balance</TableHead>
                  <TableHead>Spending Limit</TableHead>
                  <TableHead>Account Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spendingData.length > 0 ? (
                  spendingData.map((driver: any) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.name}</TableCell>
                      <TableCell>{getStatusBadge(driver.status)}</TableCell>
                      <TableCell>
                        <span
                          className={driver.periodSpent > 0 ? "font-medium text-orange-600" : "text-muted-foreground"}
                        >
                          {formatCurrency(driver.periodSpent, "NGN")}
                        </span>
                      </TableCell>
                      <TableCell>{driver.transactionCount}</TableCell>
                      <TableCell>
                        <span className={driver.currentBalance < 0 ? "text-destructive font-medium" : ""}>
                          {driver.currentBalance < 0
                            ? `-${formatCurrency(Math.abs(driver.currentBalance), "NGN")}`
                            : formatCurrency(driver.currentBalance, "NGN")}
                        </span>
                      </TableCell>
                      <TableCell>
                        {driver.spendingLimit > 0 ? (
                          formatCurrency(driver.spendingLimit, "NGN")
                        ) : (
                          <span className="text-muted-foreground">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {driver.hasAccount ? (
                          getBalanceStatus(driver.currentBalance, driver.spendingLimit)
                        ) : (
                          <Badge variant="outline">No Account</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No spending data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
