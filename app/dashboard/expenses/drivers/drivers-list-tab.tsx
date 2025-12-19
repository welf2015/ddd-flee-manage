"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Briefcase } from "lucide-react"
import useSWR from "swr"
import DriverDetailSheet from "@/components/driver-spending/driver-detail-sheet"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type DriversListTabProps = {
  initialDrivers?: any[]
}

export default function DriversListTab({ initialDrivers = [] }: DriversListTabProps) {
  const [selectedDriver, setSelectedDriver] = useState<any>(null)

  const { data: drivers = initialDrivers } = useSWR("/api/driver-spending/drivers", fetcher, {
    fallbackData: initialDrivers,
    revalidateOnMount: false,
    refreshInterval: 5000,
  })

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
                    <p className="text-sm text-muted-foreground">{driver.phone}</p>
                  </div>
                </div>
                <Badge variant={driver.status === "Active" ? "default" : "secondary"}>{driver.status || "Active"}</Badge>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Balance</span>
                  <span className="font-semibold">
                    ₦{driver.account?.current_balance?.toLocaleString() || "0"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Spending Limit</span>
                  <span className="font-semibold">₦{driver.account?.spending_limit?.toLocaleString() || "0"}</span>
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
