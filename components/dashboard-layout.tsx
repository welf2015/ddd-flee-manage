"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Home,
  Truck,
  AlertCircle,
  Building2,
  TrendingUp,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  Plus,
  Package,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  Wrench,
  Star,
  CheckSquare,
  Fuel,
  FileText,
  Wallet,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect, startTransition } from "react"
import { cn } from "@/lib/utils"
import { NotificationsBell } from "@/components/notifications-bell"
import { Progress } from "@/components/ui/progress"

interface DashboardLayoutProps {
  children: React.ReactNode
  onSignOut: () => void
}

export function DashboardLayout({ children, onSignOut }: DashboardLayoutProps) {
  const [open, setOpen] = useState(false)
  const [vehicleManagementOpen, setVehicleManagementOpen] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (
      pathname.startsWith("/dashboard/vehicle-management") ||
      pathname === "/dashboard/vehicles" ||
      pathname === "/dashboard/incidents"
    ) {
      setVehicleManagementOpen(true)
    }
  }, [pathname])

  useEffect(() => {
    setIsNavigating(false)
  }, [pathname])

  const handleNavigation = (href: string) => {
    setIsNavigating(true)
    setOpen(false)
    startTransition(() => {
      router.push(href)
    })
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Bookings", href: "/dashboard/bookings", icon: ClipboardList },
    {
      name: "Vehicle Management",
      href: "/dashboard/vehicle-management",
      icon: Truck,
      hasSubmenu: true,
      submenu: [
        { name: "Vehicles", href: "/dashboard/vehicle-management/vehicles", icon: Truck },
        { name: "Onboarding", href: "/dashboard/vehicle-management/onboarding", icon: ClipboardList },
        { name: "Fuel/Charging", href: "/dashboard/vehicle-management/fuel", icon: Fuel },
        { name: "Feedbacks", href: "/dashboard/vehicle-management/feedbacks", icon: Star },
        { name: "Compliance", href: "/dashboard/vehicle-management/compliance", icon: CheckSquare },
        { name: "Inspections", href: "/dashboard/vehicle-management/inspections", icon: ClipboardList },
        { name: "Incidents", href: "/dashboard/incidents", icon: AlertCircle },
        { name: "Maintenance/Repairs", href: "/dashboard/vehicle-management/maintenance", icon: Wrench },
      ],
    },
    { name: "Clients", href: "/dashboard/clients", icon: Building2 },
    { name: "Procurement", href: "/dashboard/procurement", icon: ShoppingCart },
    { name: "Expenses", href: "/dashboard/expenses", icon: Wallet },
    { name: "Inventory", href: "/dashboard/inventory", icon: Package },
    { name: "Sales Insights", href: "/dashboard/sales-insights", icon: TrendingUp },
    { name: "Reports", href: "/dashboard/reports", icon: TrendingUp },
    { name: "Accountability", href: "/dashboard/accountability", icon: FileText },
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
          onClick={() => handleNavigation("/dashboard/bookings")}
        >
          <Plus className="h-5 w-5" />
          Create Booking
        </Button>
      </div>
      <nav className="space-y-1 px-2 flex-1">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/dashboard")
          const isSubmenuOpen = vehicleManagementOpen && item.hasSubmenu

          return (
            <div key={item.href}>
              {item.hasSubmenu ? (
                <>
                  <Button
                    variant={isActive ? "ghost" : "ghost"}
                    className={cn(
                      "w-full justify-between h-11",
                      isActive && "bg-accent text-accent-foreground hover:bg-accent/90",
                    )}
                    onClick={() => setVehicleManagementOpen(!vehicleManagementOpen)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    {isSubmenuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                  {isSubmenuOpen && item.submenu && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.submenu.map((subitem) => {
                        const SubIcon = subitem.icon
                        const isSubActive = pathname === subitem.href
                        return (
                          <Button
                            key={subitem.href}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start gap-3 text-sm h-10",
                              isSubActive && "bg-accent text-accent-foreground hover:bg-accent/90",
                            )}
                            onClick={() => handleNavigation(subitem.href)}
                          >
                            <SubIcon className="h-5 w-5" />
                            {subitem.name}
                          </Button>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-11",
                    isActive && "bg-accent text-accent-foreground hover:bg-accent/90",
                  )}
                  onClick={() => handleNavigation(item.href)}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Button>
              )}
            </div>
          )
        })}
      </nav>
      <div className="p-2 border-t border-border">
        <Button variant="ghost" className="w-full justify-start gap-3 h-11" onClick={onSignOut}>
          <LogOut className="h-6 w-6" />
          <span className="text-sm font-medium">Sign Out</span>
        </Button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-[100]">
          <Progress value={100} className="h-1 rounded-none [&>div]:bg-accent animate-pulse" />
        </div>
      )}

      <div className="flex">
        <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-[320px] border-r border-border bg-background/50 backdrop-blur">
          <Sidebar />
        </aside>

        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] p-0 bg-background/95 backdrop-blur flex flex-col">
                <Sidebar />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="hidden lg:flex fixed top-0 right-0 left-[320px] z-50 px-6 h-16 items-center justify-end border-b border-border bg-background/95 backdrop-blur">
          <NotificationsBell />
        </div>

        <main className="flex-1 lg:ml-[320px] p-4 md:p-6 pt-20 lg:pt-20 min-h-screen">{children}</main>
      </div>
    </div>
  )
}
