'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { 
  updateProcurementStatus, 
  negotiateProcurement,
  closeProcurementDeal,
  markProcurementAsPaid,
  addShippingInfo,
  markAsArrived,
  assignClearingAgent,
  moveToOnboarding
} from "@/app/actions/procurement"
import { Calendar, DollarSign, Package, Truck, User, FileText, Clock, CheckCircle2 } from 'lucide-react'
import { format } from "date-fns"

interface ProcurementDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  procurementId: string
}

export function ProcurementDetailSheet({ open, onOpenChange, procurementId }: ProcurementDetailSheetProps) {
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [negotiationAmount, setNegotiationAmount] = useState("")
  const [negotiationNote, setNegotiationNote] = useState("")
  const [invoiceUrl, setInvoiceUrl] = useState("")
  const [waybill, setWaybill] = useState("")
  const [shippingDuration, setShippingDuration] = useState("")
  const [selectedAgent, setSelectedAgent] = useState("")

  const { data: procurement, mutate } = useSWR(
    procurementId ? `procurement-${procurementId}` : null,
    async () => {
      const { data } = await supabase
        .from("procurements")
        .select(`
          *,
          vendor:vendors(name, email, phone),
          clearing_agent:clearing_agents(name, email, phone),
          negotiations:procurement_negotiations(*),
          timeline:procurement_timeline(*)
        `)
        .eq("id", procurementId)
        .single()
      
      return data
    },
    { refreshInterval: 3000 }
  )

  const { data: agents = [] } = useSWR(
    "clearing-agents",
    async () => {
      const { data } = await supabase
        .from("clearing_agents")
        .select("*")
        .eq("status", "Active")
      return data || []
    }
  )

  if (!procurement) {
    return null
  }

  const handleNegotiate = async () => {
    if (!negotiationAmount) return
    setIsSubmitting(true)
    await negotiateProcurement(procurementId, parseFloat(negotiationAmount), negotiationNote)
    setNegotiationAmount("")
    setNegotiationNote("")
    mutate()
    setIsSubmitting(false)
  }

  const handleCloseDeal = async () => {
    setIsSubmitting(true)
    await closeProcurementDeal(procurementId)
    mutate()
    setIsSubmitting(false)
  }

  const handleMarkPaid = async () => {
    if (!invoiceUrl) return
    setIsSubmitting(true)
    await markProcurementAsPaid(procurementId, invoiceUrl)
    setInvoiceUrl("")
    mutate()
    setIsSubmitting(false)
  }

  const handleAddShipping = async () => {
    if (!waybill || !shippingDuration) return
    setIsSubmitting(true)
    await addShippingInfo(procurementId, waybill, parseInt(shippingDuration))
    setWaybill("")
    setShippingDuration("")
    mutate()
    setIsSubmitting(false)
  }

  const handleMarkArrived = async () => {
    setIsSubmitting(true)
    await markAsArrived(procurementId)
    mutate()
    setIsSubmitting(false)
  }

  const handleAssignAgent = async () => {
    if (!selectedAgent) return
    setIsSubmitting(true)
    await assignClearingAgent(procurementId, selectedAgent)
    setSelectedAgent("")
    mutate()
    setIsSubmitting(false)
  }

  const handleMoveToOnboarding = async () => {
    setIsSubmitting(true)
    await moveToOnboarding(procurementId)
    mutate()
    setIsSubmitting(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Negotiation": return "bg-yellow-500/10 text-yellow-500"
      case "Deal Closed": return "bg-blue-500/10 text-blue-500"
      case "Payment Pending": return "bg-orange-500/10 text-orange-500"
      case "Paid": return "bg-green-500/10 text-green-500"
      case "In Transit": return "bg-purple-500/10 text-purple-500"
      case "Arrived": return "bg-teal-500/10 text-teal-500"
      case "Clearing": return "bg-indigo-500/10 text-indigo-500"
      case "Ready for Onboarding": return "bg-green-600/10 text-green-600"
      default: return "bg-gray-500/10 text-gray-500"
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-4/5 lg:w-3/4 xl:w-2/3 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>{procurement.procurement_number}</span>
            <Badge className={getStatusColor(procurement.status)}>{procurement.status}</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Action Buttons Based on Status */}
          <div className="flex flex-wrap gap-2">
            {procurement.status === "Negotiation" && (
              <Button onClick={handleCloseDeal} disabled={isSubmitting} className="bg-accent text-accent-foreground">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Close Deal / Vendor Accepted
              </Button>
            )}

            {procurement.status === "Deal Closed" && (
              <Badge className="bg-orange-500/10 text-orange-500 py-2 px-4">
                Payment Pending - Awaiting Payment
              </Badge>
            )}

            {procurement.status === "Payment Pending" && (
              <div className="flex gap-2">
                <Input
                  placeholder="Invoice/Receipt URL"
                  value={invoiceUrl}
                  onChange={(e) => setInvoiceUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleMarkPaid} disabled={isSubmitting || !invoiceUrl}>
                  Mark as Paid
                </Button>
              </div>
            )}

            {procurement.status === "Paid" && (
              <div className="flex gap-2 flex-wrap w-full">
                <Input
                  placeholder="Waybill/Tracking Number"
                  value={waybill}
                  onChange={(e) => setWaybill(e.target.value)}
                  className="flex-1 min-w-[200px]"
                />
                <Select value={shippingDuration} onValueChange={setShippingDuration}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Shipping Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Months</SelectItem>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="4">4 Months</SelectItem>
                    <SelectItem value="5">5 Months</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddShipping} disabled={isSubmitting || !waybill || !shippingDuration}>
                  Add Shipping Info
                </Button>
              </div>
            )}

            {procurement.status === "In Transit" && procurement.expected_arrival && (
              <Button onClick={handleMarkArrived} disabled={isSubmitting} variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Mark as Arrived
              </Button>
            )}

            {procurement.status === "Arrived" && (
              <div className="flex gap-2 w-full">
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select Clearing Agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent: any) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAssignAgent} disabled={isSubmitting || !selectedAgent}>
                  Assign Agent
                </Button>
              </div>
            )}

            {procurement.status === "Clearing" && (
              <Button onClick={handleMoveToOnboarding} disabled={isSubmitting} className="bg-accent text-accent-foreground">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Move to Onboarding
              </Button>
            )}
          </div>

          <Separator />

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="negotiations">Negotiations</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              {/* Vehicle Details */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Vehicle Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Vehicle Type</p>
                      <p className="font-medium">{procurement.vehicle_type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Specifications</p>
                      <p className="font-medium">{procurement.specifications || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className="font-medium">{procurement.quantity || 1}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vendor Details */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Vendor Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Vendor Name</p>
                      <p className="font-medium">{procurement.vendor?.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{procurement.vendor?.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{procurement.vendor?.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Details */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Pricing Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Initial Quote</p>
                      <p className="font-medium">₦{procurement.initial_quote?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Negotiated Price</p>
                      <p className="font-medium">₦{procurement.negotiated_price?.toLocaleString() || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Final Price</p>
                      <p className="font-medium text-lg text-accent">₦{procurement.final_price?.toLocaleString() || "Pending"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Details */}
              {procurement.waybill_number && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Shipping Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Waybill/Tracking</p>
                        <p className="font-medium">{procurement.waybill_number}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expected Arrival</p>
                        <p className="font-medium">
                          {procurement.expected_arrival 
                            ? format(new Date(procurement.expected_arrival), "MMM dd, yyyy")
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Clearing Agent */}
              {procurement.clearing_agent && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Clearing Agent
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Agent Name</p>
                        <p className="font-medium">{procurement.clearing_agent?.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Contact</p>
                        <p className="font-medium">{procurement.clearing_agent?.phone}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="negotiations" className="space-y-4">
              {/* Negotiation Form */}
              {procurement.status === "Negotiation" && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <Label>Negotiation Amount</Label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={negotiationAmount}
                        onChange={(e) => setNegotiationAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Note</Label>
                      <Textarea
                        placeholder="Add negotiation note..."
                        value={negotiationNote}
                        onChange={(e) => setNegotiationNote(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleNegotiate} disabled={isSubmitting || !negotiationAmount}>
                      Submit Negotiation
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Negotiation History */}
              <div className="space-y-3">
                {procurement.negotiations?.map((neg: any) => (
                  <Card key={neg.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-lg">₦{neg.amount?.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            by {neg.negotiated_by_role} • {format(new Date(neg.created_at), "MMM dd, yyyy HH:mm")}
                          </p>
                        </div>
                        <Badge variant={neg.status === "Accepted" ? "default" : "secondary"}>
                          {neg.status}
                        </Badge>
                      </div>
                      {neg.note && <p className="text-sm mt-2">{neg.note}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-3">
              {procurement.timeline?.map((event: any) => (
                <Card key={event.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="font-medium">{event.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.created_at), "MMM dd, yyyy HH:mm")}
                        </p>
                        {event.details && (
                          <p className="text-sm mt-1">{event.details}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
