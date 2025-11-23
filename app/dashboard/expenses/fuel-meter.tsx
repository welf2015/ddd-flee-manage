"use client"

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
  // This shows remaining balance (like fuel gauge - F is full, L is low/empty)
  // If no deposits yet, show based on spending vs a default scale
  let maxDisplay = totalDeposited > 0 ? totalDeposited : Math.max(totalSpent * 2, 1000000) // At least 1M or 2x spent
  if (maxDisplay === 0) maxDisplay = 1000000 // Default to 1M if everything is 0
  
  const remainingBalance = totalDeposited > 0 
    ? Math.max(0, totalDeposited - displaySpent) // Can't go below 0
    : Math.max(0, maxDisplay - displaySpent)
  
  const percentage = maxDisplay > 0 ? Math.min((remainingBalance / maxDisplay) * 100, 100) : 100

  // Progress bar style like compliance - red to green gradient
  const totalBars = 20
  const filledBars = Math.round((percentage / 100) * totalBars)

  // Get color for each bar based on position (red to green gradient)
  // Red = low fuel (high spending), Green = full (low spending)
  const getBarColor = (index: number) => {
    const barPercentage = (index / totalBars) * 100
    if (barPercentage < 25) return '#ef4444' // Red (low fuel)
    if (barPercentage < 50) return '#f97316' // Orange
    if (barPercentage < 75) return '#eab308' // Yellow
    return '#22c55e' // Green (full)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-muted-foreground">L</span>
      <div className="font-mono text-lg font-bold">
        {Array.from({ length: totalBars }, (_, i) => (
          <span
            key={i}
            style={{
              color: i < filledBars ? getBarColor(i) : '#e5e7eb', // Gray for unfilled
            }}
          >
            {i < filledBars ? '|' : '·'}
          </span>
        ))}
      </div>
      <span className="text-xs font-semibold text-muted-foreground">F</span>
    </div>
  )
}

