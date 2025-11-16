"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { updateProcurementPrice, approveProcurement } from "@/app/actions/procurement"
import { toast } from "sonner"

export function ProcurementDetailDialog({ procurement, open, onOpenChange }: any) {
  const [updatingPrice, setUpdatingPrice] = useState(false)
  const [approving, setApproving] = useState(false)
  const supabase = createClient()

  const { data: timeline = [] } = useSWR(
    open ? `procurement-timeline-${procurement.id}` : null,
    async () => {
      const { data } = await supabase
        .from("procurement_timeline")
        .select("*")
        .eq("procurement_id", procurement.id)
        .order("created_at", { ascending: false })
      return data || []
    },
    { refreshInterval: 2000 },
  )

  const { data: documents = [] } = useSWR(open ? `procurement-docs-${procurement.id}` : null, async () => {
    const { data } = await supabase.from("procurement_documents").select("*").eq("procurement_id", procurement.id)
    return data || []
  })

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingPrice(true)

    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const price = Number.parseFloat(formData.get("negotiated_price") as string)

    const result = await updateProcurementPrice(procurement.id, price)
    setUpdatingPrice(false)

    if (result.success) {
      toast.success("Price updated successfully")
    } else {
      toast.error(result.error)
    }
  }

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault()
    setApproving(true)

    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const finalPrice = Number.parseFloat(formData.get("final_price") as string)

    const result = await approveProcurement(procurement.id, finalPrice)
    setApproving(false)

    if (result.success) {
      toast.success("Procurement approved")
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{procurement.procurement_number}</DialogTitle>
            <Badge>{procurement.status}</Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <Tabs defaultValue="details" className="w-full pr-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Procurement Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Vendor</Label>
                      <p className="font-medium">{procurement.vendor?.name}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Vehicle Type</Label>
                      <p className="font-medium">{procurement.vehicle_type}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Quantity</Label>
                      <p className="font-medium">{procurement.quantity}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Initial Quote</Label>
                      <p className="font-medium">₦{procurement.initial_quote}</p>
                    </div>
                  </div>

                  {procurement.status === "Negotiation" && (
                    <form onSubmit={handleUpdatePrice} className="space-y-2 border-t pt-4">
                      <Label>Update Negotiation Price</Label>
                      <div className="flex gap-2">
                        <Input
                          name="negotiated_price"
                          type="number"
                          placeholder="Enter negotiated price"
                          step="0.01"
                          required
                        />
                        <Button type="submit" disabled={updatingPrice} size="sm">
                          Update
                        </Button>
                      </div>
                    </form>
                  )}

                  {procurement.status === "Negotiation" && (
                    <form onSubmit={handleApprove} className="space-y-2 border-t pt-4">
                      <Label>Approve & Set Final Price</Label>
                      <div className="flex gap-2">
                        <Input
                          name="final_price"
                          type="number"
                          placeholder="Final approved price"
                          step="0.01"
                          required
                        />
                        <Button type="submit" disabled={approving} size="sm" className="bg-green-600">
                          Approve
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {documents.length > 0 ? (
                    <div className="space-y-2">
                      {documents.map((doc: any) => (
                        <a
                          key={doc.id}
                          href={doc.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-2 border rounded hover:bg-muted text-accent underline"
                        >
                          {doc.document_name}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {timeline.map((event: any) => (
                      <div key={event.id} className="flex gap-3 pb-3 border-b last:border-0">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{event.action_type}</p>
                          {event.notes && <p className="text-xs text-muted-foreground mt-1">{event.notes}</p>}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(event.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
