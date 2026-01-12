"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download, Settings2 } from "lucide-react"
import useSWR from "swr"
import { getExpenseTransactions, getPrepaidAccounts } from "@/app/actions/expenses"
import { formatCurrency } from "@/lib/utils"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type PeriodType = "this_week" | "last_week" | "two_weeks_ago" | "this_month" | "three_months" | "one_year" | "all_time"

interface MetricCard {
  label: string
  value: number
  previousValue: number
  percentageChange: number
  isPositive: boolean
}

export function InsightsClient() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("this_week")
  const [comparePeriod, setComparePeriod] = useState<PeriodType>("last_week")

  // Fetch all transactions
  const { data: fuelData } = useSWR("insights-fuel", () =>
    getExpenseTransactions({ expenseType: "Fuel" }).then((r) => r.data || []),
  )

  const { data: ticketingData } = useSWR("insights-ticketing", () =>
    getExpenseTransactions({ expenseType: "Ticketing" }).then((r) => r.data || []),
  )

  const { data: allowanceData } = useSWR("insights-allowance", () =>
    getExpenseTransactions({ expenseType: "Allowance" }).then((r) => r.data || []),
  )

  const { data: accountsData } = useSWR("insights-accounts", () => getPrepaidAccounts().then((r) => r.data || []))

  // Calculate date ranges
  const getDateRange = (period: PeriodType) => {
    const now = new Date()
    const start = new Date()
    const end = new Date()

    switch (period) {
      case "this_week": {
        const dayOfWeek = now.getDay()
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        start.setDate(now.getDate() + diff)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      }
      case "last_week": {
        const dayOfWeek = now.getDay()
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        start.setDate(now.getDate() + diff - 7)
        start.setHours(0, 0, 0, 0)
        end.setDate(now.getDate() + diff - 1)
        end.setHours(23, 59, 59, 999)
        break
      }
      case "two_weeks_ago": {
        const dayOfWeek = now.getDay()
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        start.setDate(now.getDate() + diff - 14)
        start.setHours(0, 0, 0, 0)
        end.setDate(now.getDate() + diff - 8)
        end.setHours(23, 59, 59, 999)
        break
      }
      case "this_month": {
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      }
      case "three_months": {
        start.setMonth(now.getMonth() - 3)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      }
      case "one_year": {
        start.setFullYear(now.getFullYear() - 1)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      }
      case "all_time": {
        start.setFullYear(2000)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      }
    }

    return { start, end }
  }

  // Calculate totals for a period
  const calculatePeriodTotal = (transactions: any[], period: PeriodType) => {
    if (!transactions || transactions.length === 0) return 0
    const { start, end } = getDateRange(period)
    return transactions
      .filter((t) => {
        const tDate = new Date(t.transaction_date)
        return tDate >= start && tDate <= end
      })
      .reduce((sum, t) => sum + Number(t.amount), 0)
  }

  // Calculate metrics
  const fuelMetrics = useMemo(() => {
    const current = calculatePeriodTotal(fuelData || [], selectedPeriod)
    const previous = calculatePeriodTotal(fuelData || [], comparePeriod)
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0
    return {
      label: "Total Fuel",
      value: current,
      previousValue: previous,
      percentageChange: change,
      isPositive: change <= 0, // Lower spending is better
    }
  }, [fuelData, selectedPeriod, comparePeriod])

  const ticketingMetrics = useMemo(() => {
    const current = calculatePeriodTotal(ticketingData || [], selectedPeriod)
    const previous = calculatePeriodTotal(ticketingData || [], comparePeriod)
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0
    return {
      label: "Total Ticketing",
      value: current,
      previousValue: previous,
      percentageChange: change,
      isPositive: change <= 0,
    }
  }, [ticketingData, selectedPeriod, comparePeriod])

  const allowanceMetrics = useMemo(() => {
    const current = calculatePeriodTotal(allowanceData || [], selectedPeriod)
    const previous = calculatePeriodTotal(allowanceData || [], comparePeriod)
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0
    return {
      label: "Total Allowances",
      value: current,
      previousValue: previous,
      percentageChange: change,
      isPositive: change <= 0,
    }
  }, [allowanceData, selectedPeriod, comparePeriod])

  // Generate chart data
  const generateChartData = (transactions: any[], period: PeriodType, comparePeriodType: PeriodType) => {
    if (!transactions || transactions.length === 0) return []

    const { start: currentStart, end: currentEnd } = getDateRange(period)
    const { start: compareStart, end: compareEnd } = getDateRange(comparePeriodType)

    const days = 7 // Show 7 days worth of data
    const chartData = []

    for (let i = 0; i < days; i++) {
      const dayDate = new Date(currentStart)
      dayDate.setDate(dayDate.getDate() + i)
      dayDate.setHours(0, 0, 0, 0)

      const nextDay = new Date(dayDate)
      nextDay.setDate(nextDay.getDate() + 1)

      // Current period
      const currentDayTotal = transactions
        .filter((t) => {
          const tDate = new Date(t.transaction_date)
          return tDate >= dayDate && tDate < nextDay && tDate >= currentStart && tDate <= currentEnd
        })
        .reduce((sum, t) => sum + Number(t.amount), 0)

      // Compare period
      const compareDayDate = new Date(compareStart)
      compareDayDate.setDate(compareDayDate.getDate() + i)
      const compareNextDay = new Date(compareDayDate)
      compareNextDay.setDate(compareNextDay.getDate() + 1)

      const compareDayTotal = transactions
        .filter((t) => {
          const tDate = new Date(t.transaction_date)
          return tDate >= compareDayDate && tDate < compareNextDay && tDate >= compareStart && tDate <= compareEnd
        })
        .reduce((sum, t) => sum + Number(t.amount), 0)

      chartData.push({
        day: dayDate.toLocaleDateString("en-US", { weekday: "short" }),
        current: currentDayTotal,
        compare: compareDayTotal,
      })
    }

    return chartData
  }

  const fuelChartData = useMemo(
    () => generateChartData(fuelData || [], selectedPeriod, comparePeriod),
    [fuelData, selectedPeriod, comparePeriod],
  )

  const ticketingChartData = useMemo(
    () => generateChartData(ticketingData || [], selectedPeriod, comparePeriod),
    [ticketingData, selectedPeriod, comparePeriod],
  )

  const allowanceChartData = useMemo(
    () => generateChartData(allowanceData || [], selectedPeriod, comparePeriod),
    [allowanceData, selectedPeriod, comparePeriod],
  )

  const fuelVendorBreakdown = useMemo(() => {
    if (!fuelData || fuelData.length === 0) return []
    const { start, end } = getDateRange(selectedPeriod)
    const filtered = fuelData.filter((t) => {
      const tDate = new Date(t.transaction_date)
      return tDate >= start && tDate <= end
    })

    const breakdown: Record<string, number> = {}
    filtered.forEach((t) => {
      const vendor = t.account?.vendor?.vendor_name || t.vendor_name || "Unknown Vendor"
      breakdown[vendor] = (breakdown[vendor] || 0) + Number(t.amount)
    })

    return Object.entries(breakdown)
      .map(([vendor, amount]) => ({ vendor, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [fuelData, selectedPeriod])

  const ticketingAgencyBreakdown = useMemo(() => {
    if (!ticketingData || ticketingData.length === 0) return []
    const { start, end } = getDateRange(selectedPeriod)
    const filtered = ticketingData.filter((t) => {
      const tDate = new Date(t.transaction_date)
      return tDate >= start && tDate <= end
    })

    const breakdown: Record<string, number> = {}
    filtered.forEach((t) => {
      const agency = t.account?.vendor?.vendor_name || t.vendor_name || "Unknown Agency"
      breakdown[agency] = (breakdown[agency] || 0) + Number(t.amount)
    })

    return Object.entries(breakdown)
      .map(([agency, amount]) => ({ agency, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [ticketingData, selectedPeriod])

  const allowanceDriverBreakdown = useMemo(() => {
    if (!allowanceData || allowanceData.length === 0) return []
    const { start, end } = getDateRange(selectedPeriod)
    const filtered = allowanceData.filter((t) => {
      const tDate = new Date(t.transaction_date)
      return tDate >= start && tDate <= end
    })

    const breakdown: Record<string, number> = {}
    filtered.forEach((t) => {
      const driver = t.driver?.full_name || "Unknown Driver"
      breakdown[driver] = (breakdown[driver] || 0) + Number(t.amount)
    })

    return Object.entries(breakdown)
      .map(([driver, amount]) => ({ driver, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [allowanceData, selectedPeriod])

  const periodLabel = {
    this_week: "This Week",
    last_week: "Last Week",
    two_weeks_ago: "2 Weeks Ago",
    this_month: "This Month",
    three_months: "3 Months",
    one_year: "1 Year",
    all_time: "All Time",
  }

  const handleExport = () => {
    const csvData = [
      ["Period Comparison", periodLabel[selectedPeriod], "vs", periodLabel[comparePeriod]],
      [],
      ["Metric", "Current", "Previous", "Change %"],
      ["Total Fuel", fuelMetrics.value, fuelMetrics.previousValue, fuelMetrics.percentageChange.toFixed(2)],
      [
        "Total Ticketing",
        ticketingMetrics.value,
        ticketingMetrics.previousValue,
        ticketingMetrics.percentageChange.toFixed(2),
      ],
      [
        "Total Allowances",
        allowanceMetrics.value,
        allowanceMetrics.previousValue,
        allowanceMetrics.percentageChange.toFixed(2),
      ],
    ]

    const csvString = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvString], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `expense-insights-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Expense Insights</h1>
          <p className="text-sm text-muted-foreground">Executive overview of company expense trends</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Settings2 className="h-4 w-4" />
            Customize
          </Button>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Compare</span>
          <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as PeriodType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="last_week">Last Week</SelectItem>
              <SelectItem value="two_weeks_ago">2 Weeks Ago</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="three_months">3 Months</SelectItem>
              <SelectItem value="one_year">1 Year</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <span className="text-sm text-muted-foreground">to</span>

        <div className="flex items-center gap-2">
          <Select value={comparePeriod} onValueChange={(value) => setComparePeriod(value as PeriodType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="last_week">Last Week</SelectItem>
              <SelectItem value="two_weeks_ago">2 Weeks Ago</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="three_months">3 Months</SelectItem>
              <SelectItem value="one_year">1 Year</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Fuel Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Fuel</CardTitle>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <span className="text-lg">⋯</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold">{formatCurrency(fuelMetrics.value, "NGN")}</div>
              <div
                className={`flex items-center gap-1 text-sm font-medium mt-2 ${fuelMetrics.isPositive ? "text-green-600" : "text-red-600"}`}
              >
                <span>
                  {fuelMetrics.isPositive ? "↓" : "↑"} {Math.abs(fuelMetrics.percentageChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">Fuel Over Time</p>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={fuelChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }} />
                  <Line type="monotone" dataKey="current" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  <Line
                    type="monotone"
                    dataKey="compare"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Total Ticketing Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Ticketing</CardTitle>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <span className="text-lg">⋯</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold">{formatCurrency(ticketingMetrics.value, "NGN")}</div>
              <div
                className={`flex items-center gap-1 text-sm font-medium mt-2 ${ticketingMetrics.isPositive ? "text-green-600" : "text-red-600"}`}
              >
                <span>
                  {ticketingMetrics.isPositive ? "↓" : "↑"} {Math.abs(ticketingMetrics.percentageChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">Ticketing Over Time</p>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={ticketingChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }} />
                  <Line type="monotone" dataKey="current" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  <Line
                    type="monotone"
                    dataKey="compare"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Total Allowances Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Allowances</CardTitle>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <span className="text-lg">⋯</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold">{formatCurrency(allowanceMetrics.value, "NGN")}</div>
              <div
                className={`flex items-center gap-1 text-sm font-medium mt-2 ${allowanceMetrics.isPositive ? "text-green-600" : "text-red-600"}`}
              >
                <span>
                  {allowanceMetrics.isPositive ? "↓" : "↑"} {Math.abs(allowanceMetrics.percentageChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">Allowances Over Time</p>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={allowanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }} />
                  <Line type="monotone" dataKey="current" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  <Line
                    type="monotone"
                    dataKey="compare"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendor/Agency/Driver Breakdown Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Fuel Vendors Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Fuel Vendors</CardTitle>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <span className="text-lg">⋯</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {fuelVendorBreakdown.length > 0 ? (
              <div className="space-y-2">
                {fuelVendorBreakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">{item.vendor}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 flex-1 bg-purple-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-600"
                            style={{
                              width: `${(item.amount / (fuelVendorBreakdown[0]?.amount || 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium ml-2">{formatCurrency(item.amount, "NGN")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No fuel data for this period</p>
            )}
          </CardContent>
        </Card>

        {/* Ticketing Agencies Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Ticketing Agencies</CardTitle>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <span className="text-lg">⋯</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {ticketingAgencyBreakdown.length > 0 ? (
              <div className="space-y-2">
                {ticketingAgencyBreakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">{item.agency}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 flex-1 bg-blue-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600"
                            style={{
                              width: `${(item.amount / (ticketingAgencyBreakdown[0]?.amount || 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium ml-2">{formatCurrency(item.amount, "NGN")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No ticketing data for this period</p>
            )}
          </CardContent>
        </Card>

        {/* Allowance Drivers Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Driver Allowances</CardTitle>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <span className="text-lg">⋯</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {allowanceDriverBreakdown.length > 0 ? (
              <div className="space-y-2">
                {allowanceDriverBreakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">{item.driver}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 flex-1 bg-green-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-600"
                            style={{
                              width: `${(item.amount / (allowanceDriverBreakdown[0]?.amount || 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium ml-2">{formatCurrency(item.amount, "NGN")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No allowance data for this period</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
