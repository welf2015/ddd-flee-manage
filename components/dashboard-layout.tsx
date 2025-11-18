"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Home09Icon,
  Calendar03Icon,
  Truck01Icon,
  UserMultiple02Icon,
  AlertCircleIcon,
  Building03Icon,
  ChartLineData03Icon,
  Clipboard01Icon,
  Settings02Icon,
  Logout01Icon,
  Menu01Icon,
  Add01Icon,
  PackageIcon,
  ShoppingCart01Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  WrenchIcon,
  Star01Icon,
  CheckmarkSquare02Icon,
  DollarCircleIcon,
} from 'hugeicons-react'
import Link from "next/link"
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { NotificationBell } from "./notification-bell"

interface DashboardLayoutProps {
  children: React.ReactNode
  onSignOut: () => void
}

export function DashboardLayout({ children, onSignOut }: DashboardLayoutProps) {
  const [open, setOpen] = useState(false)
  const [vehicleManagementOpen, setVehicleManagementOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (
      pathname.startsWith('/dashboard/vehicle-management') ||
      pathname === '/dashboard/vehicles' ||
      pathname === '/dashboard/incidents'
    ) {
      setVehicleManagementOpen(true)
    }
  }, [pathname])

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home09Icon },
    { name: "Bookings", href: "/dashboard/bookings", icon: Clipboard01Icon },
    {
      name: "Vehicle Management",
      href: "/dashboard/vehicle-management",
      icon: Truck01Icon,
      hasSubmenu: true,
      submenu: [
        { name: "Vehicles", href: "/dashboard/vehicles", icon: Truck01Icon },
        { name: "Onboarding", href: "/dashboard/vehicle-management/onboarding", icon: Clipboard01Icon },
        { name: "Feedbacks", href: "/dashboard/vehicle-management/feedbacks", icon: Star01Icon },
        { name: "Compliance", href: "/dashboard/vehicle-management/compliance", icon: CheckmarkSquare02Icon },
        { name: "Incidents", href: "/dashboard/incidents", icon: AlertCircleIcon },
        { name: "Maintenance", href: "/dashboard/vehicle-management/maintenance", icon: WrenchIcon },
      ],
    },
    { name: "Clients", href: "/dashboard/clients", icon: Building03Icon },
    { name: "Procurement", href: "/dashboard/procurement", icon: ShoppingCart01Icon },
    { name: "Inventory", href: "/dashboard/inventory", icon: PackageIcon },
    { name: "Sales Insights", href: "/dashboard/sales-insights", icon: DollarCircleIcon },
    { name: "Reports", href: "/dashboard/reports", icon: ChartLineData03Icon },
    { name: "Settings", href: "/dashboard/settings", icon: Settings02Icon },
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
          <Add01Icon size={18} variant="stroke" />
          Create Booking
        </Button>
      </div>
      <nav className="space-y-1 px-2 flex-1">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/dashboard")
          const isSubmenuOpen = vehicleManagementOpen && item.hasSubmenu

          return (
            <div key={item.href}>
              {item.hasSubmenu ? (
                <>
                  <Button
                    variant={isActive ? "ghost" : "ghost"}
                    className={cn(
                      "w-full justify-between h-11",
                      isActive && "bg-accent text-accent-foreground hover:bg-accent/90"
                    )}
                    onClick={() => setVehicleManagementOpen(!vehicleManagementOpen)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={24} variant="duotone" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    {isSubmenuOpen ? (
                      <ArrowDown01Icon size={16} variant="stroke" />
                    ) : (
                      <ArrowRight01Icon size={16} variant="stroke" />
                    )}
                  </Button>
                  {isSubmenuOpen && item.submenu && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.submenu.map((subitem) => {
                        const SubIcon = subitem.icon
                        const isSubActive = pathname === subitem.href
                        return (
                          <Link
                            key={subitem.href}
                            href={subitem.href}
                            onClick={() => setOpen(false)}
                          >
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full justify-start gap-3 text-sm h-10",
                                isSubActive && "bg-accent text-accent-foreground hover:bg-accent/90"
                              )}
                            >
                              <SubIcon size={20} variant="duotone" />
                              {subitem.name}
                            </Button>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link href={item.href} onClick={() => setOpen(false)}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 h-11",
                      isActive && "bg-accent text-accent-foreground hover:bg-accent/90"
                    )}
                  >
                    <Icon size={24} variant="duotone" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Button>
                </Link>
              )}
            </div>
          )
        })}
      </nav>
      <div className="p-2 border-t border-border">
        <Button variant="ghost" className="w-full justify-start gap-3 h-11" onClick={onSignOut}>
          <Logout01Icon size={24} variant="duotone" />
          <span className="text-sm font-medium">Sign Out</span>
        </Button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex">
        <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-[280px] border-r border-border bg-background/50 backdrop-blur">
          <Sidebar />
        </aside>

        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu01Icon size={24} variant="stroke" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0 bg-background/95 backdrop-blur flex flex-col">
                <Sidebar />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="hidden lg:flex fixed top-0 right-0 left-[280px] z-50 px-6 h-16 items-center justify-end border-b border-border bg-background/95 backdrop-blur">
          <NotificationBell />
        </div>

        <main className="flex-1 lg:ml-[280px] p-4 md:p-6 pt-20 lg:pt-20 min-h-screen">{children}</main>
      </div>
    </div>
  )
}
