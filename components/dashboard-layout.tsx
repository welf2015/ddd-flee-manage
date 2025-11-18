"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  House,
  Calendar,
  Truck as TruckIcon,
  Users as UsersIcon,
  Warning,
  Buildings,
  ChartBar,
  ClipboardText,
  Gear,
  SignOut,
  List,
  Plus,
  Package as PackageIcon,
  ShoppingCart as ShoppingCartIcon,
  CaretDown,
  CaretRight,
  Wrench as WrenchIcon,
  Star as StarIcon,
  CheckSquare,
  CurrencyDollar,
} from '@phosphor-icons/react/dist/ssr'
import Link from "next/link"
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

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
    { name: "Dashboard", href: "/dashboard", icon: House },
    { name: "Bookings", href: "/dashboard/bookings", icon: ClipboardText },
    {
      name: "Vehicle Management",
      href: "/dashboard/vehicle-management",
      icon: TruckIcon,
      hasSubmenu: true,
      submenu: [
        { name: "Vehicles", href: "/dashboard/vehicles", icon: TruckIcon },
        { name: "Onboarding", href: "/dashboard/vehicle-management/onboarding", icon: ClipboardText },
        { name: "Feedbacks", href: "/dashboard/vehicle-management/feedbacks", icon: StarIcon },
        { name: "Compliance", href: "/dashboard/vehicle-management/compliance", icon: CheckSquare },
        { name: "Incidents", href: "/dashboard/incidents", icon: Warning },
        { name: "Maintenance", href: "/dashboard/vehicle-management/maintenance", icon: WrenchIcon },
      ],
    },
    { name: "Clients", href: "/dashboard/clients", icon: Buildings },
    { name: "Procurement", href: "/dashboard/procurement", icon: ShoppingCartIcon },
    { name: "Inventory", href: "/dashboard/inventory", icon: PackageIcon },
    { name: "Sales Insights", href: "/dashboard/sales-insights", icon: CurrencyDollar },
    { name: "Reports", href: "/dashboard/reports", icon: ChartBar },
    { name: "Settings", href: "/dashboard/settings", icon: Gear },
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
          <Plus className="h-4 w-4" weight="bold" />
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
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-between h-11"
                    onClick={() => setVehicleManagementOpen(!vehicleManagementOpen)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-6 w-6" weight="duotone" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    {isSubmenuOpen ? (
                      <CaretDown className="h-4 w-4" weight="bold" />
                    ) : (
                      <CaretRight className="h-4 w-4" weight="bold" />
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
                              variant={isSubActive ? "secondary" : "ghost"}
                              className="w-full justify-start gap-3 text-sm h-10"
                            >
                              <SubIcon className="h-5 w-5" weight="duotone" />
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
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3 h-11"
                  >
                    <Icon className="h-6 w-6" weight="duotone" />
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
          <SignOut className="h-6 w-6" weight="duotone" />
          <span className="text-sm font-medium">Sign Out</span>
        </Button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex">
        {/* Desktop Sidebar - Fixed width and position */}
        <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-[280px] border-r border-border bg-background/50 backdrop-blur">
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
                <List className="h-6 w-6" weight="bold" />
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
