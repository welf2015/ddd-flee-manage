"use client"

import { Bell, CheckCircle, AlertCircle, AlertTriangle, Package } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef } from "react"
import { getPendingInspectionsCount, getExpiringComplianceItems, getLowStockItems } from "@/app/actions/inspections"
import { useRouter } from 'next/navigation'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

export function NotificationsBell() {
  const [count, setCount] = useState(0)
  const [prevCount, setPrevCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [complianceAlerts, setComplianceAlerts] = useState<any[]>([])
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([])
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/notification-aero-432436-8GaM8XaTraXHs2IAHt9I4BIdHKUaUy.mp3')
    audioRef.current.volume = 0.5 // Set volume to 50%
  }, [])

  useEffect(() => {
    async function fetchCount() {
      const pendingCount = await getPendingInspectionsCount()
      const alerts = await getExpiringComplianceItems()
      const lowStock = await getLowStockItems()
      
      setComplianceAlerts(alerts)
      setLowStockAlerts(lowStock)
      
      const totalCount = pendingCount + alerts.length + lowStock.length

      // Check if we've already played the sound in this session
      const hasPlayedInSession = sessionStorage.getItem('hasPlayedNotificationSound')

      if (totalCount > 0 && !hasPlayedInSession) {
        // First load with notifications - play sound once per session
        playNotificationSound()
        sessionStorage.setItem('hasPlayedNotificationSound', 'true')
      } else if (totalCount > prevCount && prevCount > 0) {
        // New notification arrived (increase in count) - always play
        playNotificationSound()
      }
      
      setCount(totalCount)
      setPrevCount(totalCount)
    }

    fetchCount()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchCount, 30000)
    
    return () => clearInterval(interval)
  }, [prevCount])

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.log("[v0] Could not play notification sound:", error.message)
      })
    }
  }

  const handleNotificationClick = () => {
    setIsOpen(false)
    router.push("/dashboard/vehicle-management/inspections")
  }

  const handleComplianceClick = () => {
    setIsOpen(false)
    router.push("/dashboard/vehicle-management/compliance")
  }

  const handleInventoryClick = () => {
    setIsOpen(false)
    router.push("/dashboard/inventory")
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b font-semibold">Notifications</div>
        <ScrollArea className="h-[300px]">
          {count === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No new notifications
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Pending Inspections Notification */}
              {count - complianceAlerts.length - lowStockAlerts.length > 0 && (
                <button 
                  className="flex items-start gap-3 p-4 hover:bg-muted/50 text-left transition-colors border-b"
                  onClick={handleNotificationClick}
                >
                  <div className="mt-1 bg-blue-100 text-blue-600 rounded-full p-1.5">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Pending Inspections</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      You have {count - complianceAlerts.length - lowStockAlerts.length} vehicle inspection{(count - complianceAlerts.length - lowStockAlerts.length) !== 1 ? 's' : ''} waiting for review.
                    </div>
                    <div className="text-xs text-blue-600 mt-2 font-medium">
                      Review now
                    </div>
                  </div>
                </button>
              )}

              {/* Compliance Alerts */}
              {complianceAlerts.map((alert, index) => (
                <button 
                  key={`compliance-${index}`}
                  className="flex items-start gap-3 p-4 hover:bg-muted/50 text-left transition-colors border-b"
                  onClick={handleComplianceClick}
                >
                  <div className="mt-1 bg-yellow-100 text-yellow-600 rounded-full p-1.5">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Compliance Expiring</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {alert.vehicle}: {alert.item} expires in {alert.daysUntilExpiry} day{alert.daysUntilExpiry !== 1 ? 's' : ''}.
                    </div>
                    <div className="text-xs text-yellow-600 mt-2 font-medium">
                      View details
                    </div>
                  </div>
                </button>
              ))}

              {/* Low Stock Alerts */}
              {lowStockAlerts.map((item, index) => (
                <button 
                  key={`stock-${index}`}
                  className="flex items-start gap-3 p-4 hover:bg-muted/50 text-left transition-colors border-b"
                  onClick={handleInventoryClick}
                >
                  <div className="mt-1 bg-orange-100 text-orange-600 rounded-full p-1.5">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Low Stock Alert</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.name} ({item.partNumber}) is running low.
                      <br />
                      Current: {item.currentStock} / Reorder: {item.reorderLevel}
                    </div>
                    <div className="text-xs text-orange-600 mt-2 font-medium">
                      Restock now
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
