"use client"

import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import {
  negotiateProcurement,
  closeProcurementDeal,
  markProcurementAsPaid,
  addShippingInfo,
  markAsArrived,
  assignClearingAgent,
  moveToOnboarding,
  uploadProcurementDocument,
} from "@/app/actions/procurement"
import { DollarSign, Package, Truck, User, FileText, Clock, CheckCircle2, Upload, X, Download } from "lucide-react"
import { formatRelativeTime, formatDateTime, formatCurrency } from "@/lib/utils"
import { PostDealForm } from "@/components/procurement/post-deal-form" // Import PostDealForm

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
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [mtcFile, setMtcFile] = useState<File | null>(null)
  const [proformaFile, setProformaFile] = useState<File | null>(null)
  const [cocFile, setCocFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [waybill, setWaybill] = useState("")
  const [shippingDuration, setShippingDuration] = useState("")
  const [selectedAgent, setSelectedAgent] = useState("")
  const [workerUrl, setWorkerUrl] = useState("")
  const [authKey, setAuthKey] = useState("")

  const { data: procurement, mutate } = useSWR(
    procurementId ? `procurement-${procurementId}` : null,
    async () => {
      const { data } = await supabase
        .from("procurements")
        .select(`
          *,
          vendor:vendors(name, email, phone, country),
          clearing_agent:clearing_agents(name, email, phone),
          timeline:procurement_timeline(*,actor:profiles(full_name,email)),
          documents:procurement_documents(*)
        `)
        .eq("id", procurementId)
        .single()

      return data
    },
    { refreshInterval: 3000 },
  )

  const { data: agents = [] } = useSWR("clearing-agents", async () => {
    const { data } = await supabase.from("clearing_agents").select("*")
    return data || []
  })

  const fetchWorkerConfig = async () => {
    const configRes = await fetch("/api/upload")
    if (!configRes.ok) {
      throw new Error("Upload service not configured")
    }

    const { workerUrl, authKey } = await configRes.json()
    setWorkerUrl(workerUrl)
    setAuthKey(authKey)
  }

  if (!procurement) {
    return null
  }

  const handleNegotiate = async () => {
    if (!negotiationAmount) return
    setIsSubmitting(true)
    await negotiateProcurement(procurementId, Number.parseFloat(negotiationAmount), negotiationNote)
    setNegotiationAmount("")
    setNegotiationNote("")
    mutate()
    setIsSubmitting(false)
  }

  const handleCloseDeal = async () => {
    const dealPrice = negotiationAmount
      ? Number.parseFloat(negotiationAmount)
      : procurement.negotiated_price || procurement.initial_quote
    setIsSubmitting(true)
    const result = await closeProcurementDeal(procurementId, dealPrice)
    if (result.success) {
      mutate()
    }
    setIsSubmitting(false)
  }

  const handleMarkPaid = async () => {
    if (!proformaFile && !invoiceFile) return

    setIsSubmitting(true)
    setIsUploading(true)

    try {
      if (!workerUrl || !authKey) {
        await fetchWorkerConfig()
      }

      if (mtcFile) {
        const formData = new FormData()
        formData.append("file", mtcFile)
        formData.append("folder", `procurement-documents/${procurementId}`)

        const uploadRes = await fetch(workerUrl, {
          method: "POST",
          headers: {
            "X-Auth-Key": authKey,
          },
          body: formData,
        })

        if (uploadRes.ok) {
          const { url } = await uploadRes.json()
          await uploadProcurementDocument(procurementId, mtcFile.name, url, "Manufacturer's Test Certificate")
        }
      }

      if (proformaFile) {
        const formData = new FormData()
        formData.append("file", proformaFile)
        formData.append("folder", `procurement-documents/${procurementId}`)

        const uploadRes = await fetch(workerUrl, {
          method: "POST",
          headers: {
            "X-Auth-Key": authKey,
          },
          body: formData,
        })

        if (uploadRes.ok) {
          const { url } = await uploadRes.json()
          await uploadProcurementDocument(procurementId, proformaFile.name, url, "Proforma Invoice")
        }
      }

      if (cocFile) {
        const formData = new FormData()
        formData.append("file", cocFile)
        formData.append("folder", `procurement-documents/${procurementId}`)

        const uploadRes = await fetch(workerUrl, {
          method: "POST",
          headers: {
            "X-Auth-Key": authKey,
          },
          body: formData,
        })

        if (uploadRes.ok) {
          const { url } = await uploadRes.json()
          await uploadProcurementDocument(procurementId, cocFile.name, url, "Certificate of Conformity")
        }
      }

      if (invoiceFile) {
        const formData = new FormData()
        formData.append("file", invoiceFile)
        formData.append("folder", `procurement-documents/${procurementId}`)

        const uploadRes = await fetch(workerUrl, {
          method: "POST",
          headers: {
            "X-Auth-Key": authKey,
          },
          body: formData,
        })

        if (uploadRes.ok) {
          const { url } = await uploadRes.json()
          await uploadProcurementDocument(procurementId, invoiceFile.name, url, "Invoice")
        }
      }

      if (receiptFile) {
        const formData = new FormData()
        formData.append("file", receiptFile)
        formData.append("folder", `procurement-documents/${procurementId}`)

        const uploadRes = await fetch(workerUrl, {
          method: "POST",
          headers: {
            "X-Auth-Key": authKey,
          },
          body: formData,
        })

        if (uploadRes.ok) {
          const { url } = await uploadRes.json()
          await uploadProcurementDocument(procurementId, receiptFile.name, url, "Receipt")
        }
      }

      // Mark as paid
      await markProcurementAsPaid(procurementId)
      setInvoiceFile(null)
      setReceiptFile(null)
      setMtcFile(null)
      setProformaFile(null)
      setCocFile(null)
      mutate()
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setIsSubmitting(false)
      setIsUploading(false)
    }
  }

  const handleAddShipping = async () => {
    if (!waybill || !shippingDuration) return
    setIsSubmitting(true)
    await addShippingInfo(procurementId, waybill, Number.parseInt(shippingDuration))
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
      case "Negotiation":
        return "bg-yellow-500/10 text-yellow-500"
      case "Deal Closed":
        return "bg-blue-500/10 text-blue-500"
      case "Payment Pending":
        return "bg-orange-500/10 text-orange-500"
      case "Paid":
        return "bg-green-500/10 text-green-500"
      case "In Transit":
        return "bg-purple-500/10 text-purple-500"
      case "Arrived":
        return "bg-teal-500/10 text-teal-500"
      case "Clearing":
        return "bg-indigo-500/10 text-indigo-500"
      case "Ready for Onboarding":
        return "bg-green-600/10 text-green-600"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  const getCountryFlag = (countryName: string): string => {
    const flagMap: Record<string, string> = {
      Nigeria: "🇳🇬",
      "United States": "🇺🇸",
      "United Kingdom": "🇬🇧",
      Germany: "🇩🇪",
      Japan: "🇯🇵",
      China: "🇨🇳",
      France: "🇫🇷",
      Italy: "🇮🇹",
      "South Korea": "🇰🇷",
      India: "🇮🇳",
      UAE: "🇦🇪",
      "South Africa": "🇿🇦",
      Ghana: "🇬🇭",
      Kenya: "🇰🇪",
    }
    return flagMap[countryName] || "🌍"
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-4/5 lg:w-3/4 xl:w-2/3 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {/* SheetHeader and other components remain unchanged */}

        <div className="mt-6 space-y-6">
          {/* Action Buttons Based on Status */}
          <div className="flex flex-wrap gap-2">
            {procurement.status === "Negotiation" && (
              <>
                <div className="flex gap-2 flex-wrap w-full">
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-xs text-muted-foreground">Currency</Label>
                    <Select value={procurement.currency || "NGN"} disabled>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NGN">₦ NGN</SelectItem>
                        <SelectItem value="USD">$ USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-xs text-muted-foreground">Negotiation Amount</Label>
                    <Input
                      placeholder="Enter new amount"
                      type="text"
                      value={negotiationAmount}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/,/g, "")
                        if (!isNaN(Number(rawValue))) {
                          setNegotiationAmount(rawValue)
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-xs text-muted-foreground">Note (optional)</Label>
                    <Input
                      placeholder="Reason for change"
                      value={negotiationNote}
                      onChange={(e) => setNegotiationNote(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleNegotiate}
                    disabled={isSubmitting || !negotiationAmount}
                    variant="outline"
                    className="self-end bg-transparent"
                  >
                    Update Price
                  </Button>
                </div>
                <Button
                  onClick={handleCloseDeal}
                  disabled={isSubmitting}
                  className="bg-accent text-accent-foreground w-full"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Close Deal / Vendor Accepted
                </Button>
              </>
            )}

            {procurement.status === "Deal Closed" && (
              <div className="w-full">
                <PostDealForm
                  procurementId={procurementId}
                  currentStatus={procurement.status}
                  onComplete={() => mutate()}
                />
              </div>
            )}

            {procurement.status === "Payment Pending" && (
              <div className="w-full space-y-3">
                <Label className="text-sm font-medium">Upload Required Documents (Before Payment)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Manufacturer's Test Certificate</Label>
                    {mtcFile ? (
                      <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm flex-1 truncate">{mtcFile.name}</span>
                        <Button variant="ghost" size="sm" onClick={() => setMtcFile(null)} className="h-6 w-6 p-0">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Test Certificate</span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) setMtcFile(file)
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Proforma Invoice *</Label>
                    {proformaFile ? (
                      <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm flex-1 truncate">{proformaFile.name}</span>
                        <Button variant="ghost" size="sm" onClick={() => setProformaFile(null)} className="h-6 w-6 p-0">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Proforma Invoice</span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) setProformaFile(file)
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Certificate of Conformity (COC)</Label>
                    {cocFile ? (
                      <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm flex-1 truncate">{cocFile.name}</span>
                        <Button variant="ghost" size="sm" onClick={() => setCocFile(null)} className="h-6 w-6 p-0">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">COC</span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) setCocFile(file)
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Invoice Upload */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Final Invoice</Label>
                    {invoiceFile ? (
                      <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm flex-1 truncate">{invoiceFile.name}</span>
                        <Button variant="ghost" size="sm" onClick={() => setInvoiceFile(null)} className="h-6 w-6 p-0">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Choose invoice file</span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) setInvoiceFile(file)
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Receipt Upload */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Receipt</Label>
                    {receiptFile ? (
                      <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm flex-1 truncate">{receiptFile.name}</span>
                        <Button variant="ghost" size="sm" onClick={() => setReceiptFile(null)} className="h-6 w-6 p-0">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Choose receipt file</span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) setReceiptFile(file)
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleMarkPaid}
                  disabled={isSubmitting || isUploading || !proformaFile}
                  className="w-full"
                >
                  {isUploading ? "Uploading..." : "Submit Documents & Mark as Paid"}
                </Button>
              </div>
            )}

            {procurement.status === "Paid" && (
              <div className="w-full">
                <PostDealForm procurementId={procurementId} currentStatus="Deal Closed" onComplete={() => mutate()} />
              </div>
            )}

            {procurement.status === "In Transit" && procurement.expected_arrival && (
              <Button
                onClick={handleMarkArrived}
                disabled={isSubmitting}
                variant="outline"
                className="w-full bg-transparent"
              >
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
                  Assign Agent & Start Clearing
                </Button>
              </div>
            )}

            {procurement.status === "Clearing" && (
              <div className="w-full">
                <PostDealForm
                  procurementId={procurementId}
                  currentStatus={procurement.status}
                  onComplete={() => mutate()}
                />
              </div>
            )}

            {procurement.status === "Ready for Onboarding" && (
              <>
                <PostDealForm
                  procurementId={procurementId}
                  currentStatus={procurement.status}
                  onComplete={() => mutate()}
                />
                <Button
                  onClick={handleMoveToOnboarding}
                  disabled={isSubmitting}
                  className="bg-accent text-accent-foreground w-full mt-4"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Move to Onboarding
                </Button>
              </>
            )}
          </div>

          <Separator />

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
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
                      <p className="font-medium flex items-center gap-2">
                        {procurement.vendor?.country && (
                          <span className="text-xl">{getCountryFlag(procurement.vendor.country)}</span>
                        )}
                        {procurement.vendor?.name}
                      </p>
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
                      <p className="font-medium text-lg text-accent">
                        ₦{procurement.final_price?.toLocaleString() || "Pending"}
                      </p>
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
                          {procurement.expected_arrival ? formatDateTime(procurement.expected_arrival) : "N/A"}
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

            <TabsContent value="timeline" className="space-y-4 mt-4">
              {procurement.timeline
                ?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((event: any) => (
                  <Card key={event.id}>
                    <CardContent className="pt-6">
                      <div className="flex gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{event.action_type}</p>
                              {event.new_value && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {event.action_type.includes("Price")
                                    ? `to ${formatCurrency(Number(event.new_value), procurement.currency || "NGN")}`
                                    : event.new_value}
                                </p>
                              )}
                              {event.notes && <p className="text-sm mt-1">{event.notes}</p>}
                              {event.action_type === "Document Uploaded" && procurement.documents && (
                                <div className="mt-2 space-y-1">
                                  {procurement.documents
                                    .filter(
                                      (doc: any) =>
                                        new Date(doc.uploaded_at).getTime() === new Date(event.created_at).getTime(),
                                    )
                                    .map((doc: any) => (
                                      <a
                                        key={doc.id}
                                        href={doc.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-accent hover:underline"
                                      >
                                        <FileText className="h-3 w-3" />
                                        {doc.document_type}: {doc.file_name}
                                      </a>
                                    ))}
                                </div>
                              )}
                              {event.actor && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  by {event.actor.full_name || event.actor.email}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatRelativeTime(event.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="documents" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Procurement Documents
                  </h3>

                  {procurement.documents && procurement.documents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {procurement.documents.map((doc: any) => (
                        <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                          <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.document_type}</p>
                            <p className="text-xs text-muted-foreground truncate">{doc.document_name}</p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(doc.uploaded_at)}</p>
                          </div>
                          <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
                            <a href={doc.document_url} target="_blank" rel="noopener noreferrer" download>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No documents uploaded yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
