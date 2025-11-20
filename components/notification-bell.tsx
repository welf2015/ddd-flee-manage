"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import useSWR from "swr"
import { useRouter } from "next/navigation"
import { formatRelativeTime } from "@/lib/utils"

export function NotificationBell() {
  const router = useRouter()

  const { data: notifications = [] } = useSWR(
    "notifications",
    async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return []

        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10)

        if (error) {
          console.error("[v0] Error fetching notifications:", error)
          return []
        }

        return data || []
      } catch (error) {
        console.error("[v0] Notification fetch failed:", error)
        return []
      }
    },
    {
      refreshInterval: 5000,
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    },
  )

  const unreadCount = notifications.filter((n: any) => !n.read).length

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const supabase = createClient()
      await supabase.from("notifications").update({ read: true }).eq("id", notificationId)
    } catch (error) {
      console.error("[v0] Failed to mark notification as read:", error)
    }
  }

  const handleNotificationClick = (notification: any) => {
    handleMarkAsRead(notification.id)

    // Navigate based on notification type
    if (notification.type === "booking") {
      router.push(`/dashboard/bookings`)
    } else if (notification.type === "procurement") {
      router.push(`/dashboard/procurement`)
    } else if (notification.type === "maintenance") {
      router.push(`/dashboard/vehicle-management/maintenance`)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-96">
          {notifications.length > 0 ? (
            notifications.map((notification: any) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer ${!notification.read ? "bg-accent/10" : ""}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(notification.created_at)}</p>
                  </div>
                  {!notification.read && <div className="h-2 w-2 rounded-full bg-accent flex-shrink-0 mt-1" />}
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">No notifications</div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
