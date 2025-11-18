"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from 'lucide-react'
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { ProcurementDetailDialog } from "./procurement-detail-dialog"
import { ProcurementDetailSheet } from "./procurement-detail-sheet"

export function ProcurementsTable() {
  const supabase = createClient()
  const [selectedProcurementId, setSelectedProcurementId] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  const { data: procurements = [], isLoading } = useSWR(
    "procurements",
    async () => {
      const { data } = await supabase
        .from("procurements")
        .select("*, vendor:vendors(name), clearing_agent:clearing_agents(name)")
        .order("created_at", { ascending: false })

      return data || []
    },
    { refreshInterval: 5000 },
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Negotiation":
        return "bg-yellow-500/10 text-yellow-500"
      case "Approved":
        return "bg-green-500/10 text-green-500"
      case "Clearing in Progress":
        return "bg-blue-500/10 text-blue-500"
      case "Cleared":
        return "bg-purple-500/10 text-purple-500"
      case "Completed":
        return "bg-green-600/10 text-green-600"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Active Procurements</CardTitle>
          <CardDescription>Manage all vehicle procurement orders</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading procurements...</div>
          ) : procurements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No procurements yet</div>
          ) : (
            <div className="space-y-4">
              {procurements.map((proc: any) => (
                <div
                  key={proc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold">{proc.procurement_number}</p>
                      <Badge className={getStatusColor(proc.status)}>{proc.status}</Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium text-foreground">{proc.vendor?.name}</p>
                        <p className="text-xs">Vendor</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{proc.vehicle_type}</p>
                        <p className="text-xs">Vehicle Type</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          ₦{proc.final_price || proc.negotiated_price || proc.initial_quote}
                        </p>
                        <p className="text-xs">Price</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{proc.clearing_agent?.name || "Not assigned"}</p>
                        <p className="text-xs">Clearing Agent</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedProcurementId(proc.id)
                      setShowDetail(true)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showDetail && selectedProcurementId && (
        <ProcurementDetailSheet
          open={showDetail}
          onOpenChange={setShowDetail}
          procurementId={selectedProcurementId}
        />
      )}
    </>
  )
}
