"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface TrendDataPoint {
  date: string
  total_system_overdraft: number
  drivers_overdrawn: number
  critical_drivers: number
}

export function OverdraftTrendChart() {
  const [data, setData] = useState<TrendDataPoint[]>([])
  const [days, setDays] = useState<number>(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrendData = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/driver-spending/overdraft-trend?days=${days}`)
        const result = await response.json()
        setData(result.data || [])
      } catch (error) {
        console.error("[v0] Error fetching trend data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrendData()
  }, [days])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{new Date(data.date).toLocaleDateString()}</p>
          <p className="text-sm text-gray-600">System Overdraft: ₦{data.total_system_overdraft?.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Drivers Overdrawn: {data.drivers_overdrawn}</p>
          <p className="text-sm text-red-600 font-medium">Critical: {data.critical_drivers}</p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return <div className="text-center py-12">Loading trend data...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Overdraft Trend</CardTitle>
            <CardDescription>System-wide overdraft over time</CardDescription>
          </div>
          <div className="flex gap-2">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  days === d ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No trend data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickFormatter={(date) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="total_system_overdraft"
                stroke="#dc2626"
                strokeWidth={2}
                dot={false}
                name="Total Overdraft"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
