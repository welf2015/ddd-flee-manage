"use client"

import { useEffect, useState } from "react"
import { MapPin, Navigation2 } from "lucide-react"

type AnimatedRouteProps = {
  route: string
  status: string
  startedAt?: string | null
  timeline?: string | null
  isOnHold?: boolean
}

export function AnimatedRoute({ route, status, startedAt, timeline, isOnHold }: AnimatedRouteProps) {
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Parse timeline to get duration (e.g., "2hrs", "3 days", "1 week")
  const parseTimeline = (timelineStr: string | null | undefined): number => {
    if (!timelineStr) return 0
    
    const lower = timelineStr.toLowerCase()
    if (lower.includes("hr") || lower.includes("hour")) {
      const match = lower.match(/(\d+)\s*(?:hr|hour)/)
      return match ? parseInt(match[1]) * 60 * 60 * 1000 : 0 // Convert to milliseconds
    }
    if (lower.includes("day")) {
      const match = lower.match(/(\d+)\s*day/)
      return match ? parseInt(match[1]) * 24 * 60 * 60 * 1000 : 0
    }
    if (lower.includes("week")) {
      const match = lower.match(/(\d+)\s*week/)
      return match ? parseInt(match[1]) * 7 * 24 * 60 * 60 * 1000 : 0
    }
    return 0
  }

  // Calculate progress based on time elapsed
  useEffect(() => {
    if (status !== "In Transit" && status !== "On Hold") {
      setProgress(status === "Completed" ? 100 : 0)
      return
    }

    if (!startedAt) {
      setProgress(0)
      return
    }

    const totalDuration = parseTimeline(timeline)
    if (totalDuration === 0) {
      // Default to 2 hours if no timeline
      const defaultDuration = 2 * 60 * 60 * 1000
      const elapsed = Date.now() - new Date(startedAt).getTime()
      const calculatedProgress = Math.min((elapsed / defaultDuration) * 100, 100)
      setProgress(calculatedProgress)
      return
    }

    const updateProgress = () => {
      if (isOnHold || status === "On Hold") {
        setIsPaused(true)
        return
      }

      setIsPaused(false)
      const elapsed = Date.now() - new Date(startedAt).getTime()
      const calculatedProgress = Math.min((elapsed / totalDuration) * 100, 100)
      setProgress(calculatedProgress)
    }

    updateProgress()
    const interval = setInterval(updateProgress, 1000) // Update every second

    return () => clearInterval(interval)
  }, [status, startedAt, timeline, isOnHold])

  const origin = route.split("→")[0]?.trim() || "Origin"
  const destination = route.split("→")[1]?.trim() || "Destination"

  // Calculate arrow position (0% = origin, 100% = destination)
  const arrowPosition = Math.min(Math.max(progress, 0), 100)

  return (
    <div className="relative w-full">
      {/* Route Display with Animated Arrow */}
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg relative overflow-hidden">
        {/* Origin */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex flex-col items-center flex-shrink-0">
            <MapPin className="h-5 w-5 text-green-500" />
            <span className="text-xs text-muted-foreground mt-1">From</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{origin}</p>
          </div>
        </div>

        {/* Animated Route Line */}
        <div className="flex-1 relative h-16 flex flex-col items-center justify-center">
          {/* Route line */}
          <div className="absolute top-6 w-full h-0.5 bg-muted-foreground/30"></div>
          
          {/* Progress line (completed portion) */}
          <div 
            className="absolute top-6 h-0.5 bg-accent transition-all duration-1000 ease-linear"
            style={{ width: `${arrowPosition}%` }}
          ></div>

          {/* Animated Navigation Icon */}
          <div
            className="absolute top-3 transition-all duration-1000 ease-linear flex items-center justify-center"
            style={{ 
              left: `${arrowPosition}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className={`relative ${isPaused ? 'animate-pulse' : ''}`}>
              <Navigation2 
                className={`h-5 w-5 ${isPaused ? 'text-yellow-500' : 'text-green-500'} ${!isPaused ? 'animate-bounce' : ''}`}
                fill={isPaused ? 'currentColor' : 'currentColor'}
              />
              {isPaused && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded">ON HOLD</span>
                </div>
              )}
            </div>
          </div>

          {/* Route name below animation */}
          <div className="absolute bottom-0 w-full text-center">
            <p className="text-[10px] text-muted-foreground truncate px-2">{route}</p>
          </div>

          {/* Dots along the route */}
          {Array.from({ length: 5 }, (_, i) => {
            const dotPosition = (i + 1) * 20 // 20%, 40%, 60%, 80%, 100%
            const isPassed = dotPosition <= arrowPosition
            return (
              <div
                key={i}
                className="absolute top-[22px] w-2 h-2 rounded-full bg-background border-2 transition-colors duration-500"
                style={{
                  left: `${dotPosition}%`,
                  transform: 'translateX(-50%)',
                  borderColor: isPassed ? 'var(--accent)' : 'var(--muted-foreground)',
                  backgroundColor: isPassed ? 'var(--accent)' : 'var(--background)',
                }}
              />
            )
          })}
        </div>

        {/* Destination */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-1 min-w-0 text-right">
            <p className="font-medium truncate">{destination}</p>
          </div>
          <div className="flex flex-col items-center flex-shrink-0">
            <MapPin className="h-5 w-5 text-red-500" />
            <span className="text-xs text-muted-foreground mt-1">To</span>
          </div>
        </div>
      </div>

      {/* Progress Info */}
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{isPaused ? "⏸ Paused" : status === "In Transit" ? "🚛 In Transit" : "📍 Ready"}</span>
        <span>{progress.toFixed(1)}% Complete</span>
      </div>
    </div>
  )
}
