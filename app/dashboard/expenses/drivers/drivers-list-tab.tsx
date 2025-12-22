"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User } from "lucide-react"
import useSWR from "swr"
import DriverDetailSheet from "@/components/driver-spending/driver-detail-sheet"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type DriversListTabProps = {
  initialDrivers?: any[]
}

export default function DriversListTab({ initialDrivers = [] }: DriversListTabProps) {
  const [selectedDriver, setSelectedDriver] = useState<any>(null)

  const { data: drivers = initialDrivers, isLoading } = useSWR("/api/driver-spending/drivers", fetcher, {
    fallbackData: initialDrivers,
    revalidateOnMount: false,
    refreshInterval: 5000,
  })

  if (isLoading && !drivers?.length) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-200" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    <div className="h-3 w-32 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="h-5 w-16 bg-gray-200 rounded" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 w-full bg-gray-200 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {drivers?.map((driver: any) => (
          <Card
            key={driver.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedDriver(driver)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{driver.full_name}</p>
                    <p className="text-sm text-muted-foreground">{driver.phone || driver.phone_number}</p>
                  </div>
                </div>
                <Badge variant={driver.current_job_id ? "default" : "secondary"}>
                  {driver.current_job_id ? `Job ${driver.current_job_id}` : "Available"}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm italic">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs">Spent Today</span>
                  <span className="font-semibold text-orange-600">
                    ₦{(driver.account?.daily_spent || driver.daily_spent || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-muted-foreground text-xs">Account Balance</span>
                  <span className={`font-semibold ${Number(driver.current_balance || 0) < 0 ? 'text-red-600' : 'text-primary'}`}>
                    ₦{Number(driver.current_balance || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!drivers?.length && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">No drivers found</CardContent>
        </Card>
      )}

      {/* Driver Detail Sheet */}
      {selectedDriver && (
        <DriverDetailSheet
          open={!!selectedDriver}
          onOpenChange={(open) => !open && setSelectedDriver(null)}
          driver={selectedDriver}
        />
      )}
    </div>
  )
}
