"use client"

import { Bell, AlertCircle, AlertTriangle, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef } from "react"
import { getPendingInspectionsCount, getExpiringComplianceItems, getLowStockItems } from "@/app/actions/inspections"
import { useRouter } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import useSWR from "swr"

export function NotificationsBell() {
  const [count, setCount] = useState(0)
  const prevCountRef = useRef(0)
  const [isOpen, setIsOpen] = useState(false)
  const [complianceAlerts, setComplianceAlerts] = useState<any[]>([])
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([])
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const supabase = createClient()

  const { data: notifications = [], mutate } = useSWR(
    "user-notifications",
    async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return []

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(20)

      return data || []
    },
    { refreshInterval: 60000 },
  )

  useEffect(() => {
    audioRef.current = new Audio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/notification-aero-432436-8GaM8XaTraXHs2IAHt9I4BIdHKUaUy.mp3")
    audioRef.current.volume = 0.5 // Set volume to 50%
  }, [])

  useEffect(() => {
    async function fetchCount() {
      try {
        const pendingCount = await getPendingInspectionsCount()
        const alerts = await getExpiringComplianceItems()
        const lowStock = await getLowStockItems()

        setComplianceAlerts(alerts || [])
        setLowStockAlerts(lowStock || [])

        const totalCount = (notifications?.length || 0) + pendingCount + (alerts?.length || 0) + (lowStock?.length || 0)
        const prevCount = prevCountRef.current

        const hasPlayedInSession = sessionStorage.getItem("hasPlayedNotificationSound")

        if (totalCount > 0 && !hasPlayedInSession) {
          playNotificationSound()
          sessionStorage.setItem("hasPlayedNotificationSound", "true")
        } else if (totalCount > prevCount && prevCount > 0) {
          playNotificationSound()
        }

        setCount(totalCount)
        prevCountRef.current = totalCount
      } catch (error) {
        console.error("[v0] Error fetching notification counts:", error)
      }
    }

    fetchCount()

    const interval = setInterval(fetchCount, 60000)

    return () => clearInterval(interval)
  }, [notifications?.length])

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

  const handleDatabaseNotificationClick = async (notification: any) => {
    await supabase.from("notifications").update({ read: true }).eq("id", notification.id)
    mutate()

    if (notification.type === "procurement") {
      router.push("/dashboard/procurement")
    } else if (notification.type === "booking") {
      router.push("/dashboard/bookings")
    } else if (notification.type === "inspection") {
      router.push("/dashboard/vehicle-management/inspections")
    }

    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        align="end"
      >
        <div className="p-4 border-b font-semibold">Notifications</div>
        <ScrollArea className="h-[300px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {count === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">No new notifications</div>
          ) : (
            <div className="flex flex-col">
              {notifications?.map((notification: any) => (
                <button
                  key={notification.id}
                  onClick={() => handleDatabaseNotificationClick(notification)}
                  className="flex items-start gap-3 p-4 hover:bg-muted/50 text-left transition-colors border-b"
                >
                  <div className="mt-1 bg-blue-100 text-blue-600 rounded-full p-1.5">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{notification.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</div>
                    <div className="text-xs text-blue-600 mt-2 font-medium">View details</div>
                  </div>
                </button>
              ))}

              {count - (notifications?.length || 0) - (complianceAlerts?.length || 0) - (lowStockAlerts?.length || 0) > 0 && (
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
                      You have {count - (notifications?.length || 0) - (complianceAlerts?.length || 0) - (lowStockAlerts?.length || 0)} vehicle
                      inspection
                      {count - (notifications?.length || 0) - (complianceAlerts?.length || 0) - (lowStockAlerts?.length || 0) !== 1 ? "s" : ""}{" "}
                      waiting for review.
                    </div>
                    <div className="text-xs text-blue-600 mt-2 font-medium">Review now</div>
                  </div>
                </button>
              )}

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
                      {alert.vehicle}: {alert.item} expires in {alert.daysUntilExpiry} day
                      {alert.daysUntilExpiry !== 1 ? "s" : ""}.
                    </div>
                    <div className="text-xs text-yellow-600 mt-2 font-medium">View details</div>
                  </div>
                </button>
              ))}

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
                    <div className="text-xs text-orange-600 mt-2 font-medium">Restock now</div>
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
