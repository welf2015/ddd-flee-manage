"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Truck,
  Users,
  AlertTriangle,
  Building2,
  BarChart3,
  ClipboardCheck,
  Settings,
  LogOut,
  Menu,
  Plus,
  Package,
  ShoppingCart,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

interface DashboardLayoutProps {
  children: React.ReactNode
  onSignOut: () => void
}

export function DashboardLayout({ children, onSignOut }: DashboardLayoutProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Bookings", href: "/dashboard/bookings", icon: ClipboardCheck },
    { name: "Vehicles", href: "/dashboard/vehicles", icon: Truck },
    { name: "Drivers", href: "/dashboard/drivers", icon: Users },
    { name: "Incidents", href: "/dashboard/incidents", icon: AlertTriangle },
    { name: "Clients", href: "/dashboard/clients", icon: Building2 },
    { name: "Procurement", href: "/dashboard/procurement", icon: ShoppingCart },
    { name: "Inventory", href: "/dashboard/inventory", icon: Package },
    { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ]

  const Sidebar = () => (
    <>
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
      </div>
      <div className="px-4 py-4">
        <Button
          className="w-full justify-start gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
          onClick={() => router.push("/dashboard/bookings")}
        >
          <Plus className="h-4 w-4" />
          Create Booking
        </Button>
      </div>
      <nav className="space-y-2 px-2 flex-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              <Button variant={isActive ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                <Icon className="h-4 w-4" />
                {item.name}
              </Button>
            </Link>
          )
        })}
      </nav>
      <div className="p-2 border-t border-border">
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={onSignOut}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex">
        {/* Desktop Sidebar - Fixed width and position */}
        <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-[280px] border-r border-border bg-background/50 backdrop-blur overflow-hidden">
          <Sidebar />
        </aside>

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 bg-background/95 backdrop-blur flex flex-col">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content - Offset by sidebar width on desktop */}
        <main className="flex-1 lg:ml-[280px] p-4 md:p-6 pt-20 lg:pt-6 min-h-screen">{children}</main>
      </div>
    </div>
  )
}
