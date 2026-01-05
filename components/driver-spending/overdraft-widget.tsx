"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"

interface OverdraftSummary {
  total_system_overdraft: number
  total_drivers_overdrawn: number
  critical_cases: number
  average_overdraft: number
}

interface OverdrawnDriver {
  driver_id: string
  full_name: string
  overdraft_amount: number
  severity: "critical" | "warning" | "none"
}

export function OverdraftWidget() {
  const [summary, setSummary] = useState<OverdraftSummary | null>(null)
  const [topDrivers, setTopDrivers] = useState<OverdrawnDriver[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOverdraftData = async () => {
      try {
        const response = await fetch("/api/driver-spending/overdrafts?limit=3")
        const data = await response.json()
        setSummary(data.summary)
        setTopDrivers(data.overdrawn_drivers?.slice(0, 3) || [])
      } catch (error) {
        console.error("[v0] Error fetching overdraft data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOverdraftData()
  }, [])

  if (loading || !summary) {
    return null
  }

  if (summary.total_drivers_overdrawn === 0) {
    return null
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-destructive"
      case "warning":
        return "text-yellow-600"
      default:
        return "text-green-600"
    }
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <CardTitle className="text-yellow-900">Driver Overdrafts</CardTitle>
              <CardDescription className="text-yellow-800">
                {summary.total_drivers_overdrawn} driver(s) overdrawn
              </CardDescription>
            </div>
          </div>
          {summary.critical_cases > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {summary.critical_cases} Critical
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-yellow-900">₦{summary.total_system_overdraft.toLocaleString()}</span>
          <span className="text-sm text-yellow-800">Total system overdraft</span>
        </div>

        {topDrivers.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-yellow-200">
            <p className="text-sm font-medium text-yellow-900">Top overdrawn drivers:</p>
            <div className="space-y-1">
              {topDrivers.map((driver, index) => (
                <div key={driver.driver_id} className="flex items-center justify-between text-sm">
                  <span className="text-yellow-900 flex items-center gap-2">
                    <span className="font-semibold">#{index + 1}</span>
                    {driver.full_name}
                  </span>
                  <span className={`font-bold ${getSeverityColor(driver.severity)}`}>
                    ₦{driver.overdraft_amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-yellow-800 pt-2">
          Schedule allowance top-ups to clear these overdrafts and maintain cash flow.
        </p>
      </CardContent>
    </Card>
  )
}
