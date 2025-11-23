"use client"

import { formatCurrency } from "@/lib/utils"
import { useEffect, useState } from "react"

type FuelMeterProps = {
  totalSpent: number
  totalDeposited?: number
}

export function FuelMeter({ totalSpent, totalDeposited = 0 }: FuelMeterProps) {
  const [displaySpent, setDisplaySpent] = useState(totalSpent)

  // Update display when totalSpent changes
  useEffect(() => {
    setDisplaySpent(totalSpent)
  }, [totalSpent])

  // Calculate percentage for fuel meter visualization
  // Use totalDeposited as the scale if available, otherwise use a reasonable default
  // This shows spending as a percentage of what was deposited
  const maxDisplay = totalDeposited > 0 ? totalDeposited : Math.max(totalSpent * 2, 1000000) // At least 1M or 2x spent
  const percentage = maxDisplay > 0 ? Math.min((displaySpent / maxDisplay) * 100, 100) : 0

  // Color based on spending level (like fuel gauge)
  const getColor = (pct: number) => {
    if (pct < 25) return "bg-green-500"
    if (pct < 50) return "bg-yellow-500"
    if (pct < 75) return "bg-orange-500"
    return "bg-red-500"
  }

  return (
    <div className="space-y-4">
      {/* Fuel Gauge Visualization */}
      <div className="relative w-full">
        {/* Background bar */}
        <div className="h-12 bg-gray-200 rounded-full overflow-hidden relative">
          {/* Filled portion - like fuel gauge */}
          <div
            className={`h-full ${getColor(percentage)} transition-all duration-500 ease-out rounded-full`}
            style={{ width: `${percentage}%` }}
          >
            {/* Gradient effect for more realistic fuel gauge */}
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
          
          {/* Percentage indicator lines */}
          <div className="absolute inset-0 flex items-center justify-between px-2">
            {[0, 25, 50, 75, 100].map((mark) => (
              <div
                key={mark}
                className="h-full w-0.5 bg-gray-400/30"
                style={{ marginLeft: mark === 0 ? "0" : mark === 100 ? "auto" : `${mark}%` }}
              />
            ))}
          </div>
        </div>

        {/* Percentage labels */}
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>

        {/* Current percentage display */}
        <div className="text-center mt-4">
          <p className="text-2xl font-bold">{percentage.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">of display scale</p>
        </div>
      </div>

      {/* Alternative: Segmented fuel gauge (like car dashboard) */}
      <div className="mt-8">
        <p className="text-sm font-medium mb-3 text-center">Fuel Spending Level</p>
        <div className="flex items-center justify-center gap-1">
          {Array.from({ length: 20 }).map((_, i) => {
            const segmentPct = (i + 1) * 5
            const isFilled = percentage >= segmentPct
            const segmentColor = getColor(segmentPct)
            
            return (
              <div
                key={i}
                className={`h-8 w-4 rounded-sm transition-all duration-300 ${
                  isFilled ? segmentColor : "bg-gray-200"
                }`}
                style={{
                  opacity: isFilled ? 1 : 0.3,
                }}
              />
            )
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      </div>
    </div>
  )
}

