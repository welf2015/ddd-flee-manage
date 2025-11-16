"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

export function VendorsTable() {
  const supabase = createClient()

  const { data: vendors = [], isLoading } = useSWR(
    "vendors",
    async () => {
      const { data } = await supabase.from("vendors").select("*").order("created_at", { ascending: false })

      return data || []
    },
    { refreshInterval: 5000 },
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendors</CardTitle>
        <CardDescription>Vehicle suppliers and vendors</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading vendors...</div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No vendors added yet</div>
        ) : (
          <div className="space-y-4">
            {vendors.map((vendor: any) => (
              <div
                key={vendor.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex-1">
                  <p className="font-semibold">{vendor.name}</p>
                  <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground mt-2">
                    <div>
                      <p className="text-xs">Contact</p>
                      <p>{vendor.contact_name}</p>
                    </div>
                    <div>
                      <p className="text-xs">Email</p>
                      <p>{vendor.email}</p>
                    </div>
                    <div>
                      <p className="text-xs">Phone</p>
                      <p>{vendor.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
