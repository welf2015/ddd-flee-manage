"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { updatePostDealInfo, uploadProcurementDocument } from "@/app/actions/procurement"
import { Package, FileCheck, Upload, X, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

interface PostDealFormProps {
  procurementId: string
  currentStatus: string
  onComplete?: () => void
}

export function PostDealForm({ procurementId, currentStatus, onComplete }: PostDealFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    waybillNumber: "",
    shippingTrackingNo: "",
    shippingDate: "",
    estimatedMonths: "3",
    conditionOnArrival: "",
    warrantyDetails: "",
    receivedBy: "",
    clearingDate: "",
    licensePlateNumber: "",
    customsDocuments: "",
    cifLagosTerms: false,
    tdoObtained: false,
    idecWaiverValid: false,
    billOfLadingUrl: "",
    packingListUrl: "",
    commercialInvoiceUrl: "",
    receiptUrl: "",
    customDutyReceiptUrl: "",
    releaseOrderUrl: "",
    tdoUrl: "",
    receivedAt: "",
  })

  const handleFileUpload = async (file: File, fieldName: string, docType: string) => {
    setUploading(true)
    try {
      const response = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}&folder=procurement-documents/${procurementId}&contentType=${encodeURIComponent(file.type)}`,
      )

      if (!response.ok) {
        throw new Error("Failed to get upload configuration")
      }

      const config = await response.json()

      let publicUrl = ""

      // Validate config before using
      if (!config.workerUrl || !config.authKey) {
        throw new Error("Upload service not configured. Please check environment variables.")
      }

      // Validate URL before constructing
      try {
        const workerUrl = new URL(config.workerUrl)
        workerUrl.searchParams.set("filename", file.name)
        workerUrl.searchParams.set("folder", `procurement-documents/${procurementId}`)

        const uploadResponse = await fetch(workerUrl.toString(), {
          method: "PUT",
          body: file,
          headers: {
            Authorization: `Bearer ${config.authKey}`,
            "Content-Type": file.type,
          },
        })

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          throw new Error(`Failed to upload to Worker: ${errorText}`)
        }

        const result = await uploadResponse.json()
        publicUrl = result.url || result.publicUrl || ""
        
        if (!publicUrl) {
          throw new Error("Upload succeeded but no URL returned")
        }
      } catch (error: any) {
        if (error instanceof TypeError && error.message.includes("Invalid URL")) {
          throw new Error(`Invalid upload worker URL: ${config.workerUrl}. Please check R2_UPLOAD_WORKER_URL environment variable.`)
        }
        throw error
      }

      // @ts-ignore - dynamic key access
      setFormData({ ...formData, [fieldName]: publicUrl })

      await uploadProcurementDocument(procurementId, file.name, publicUrl, docType)

      toast.success(`${docType} uploaded successfully`)
    } catch (error) {
      console.error("[v0] Upload error:", error)
      toast.error("Failed to upload document")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmitShipping = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updatePostDealInfo(procurementId, {
        waybill_number: formData.waybillNumber,
        shipping_tracking_no: formData.shippingTrackingNo,
        shipping_date: formData.shippingDate,
        estimated_delivery_months: Number.parseInt(formData.estimatedMonths),
        cif_lagos_terms: formData.cifLagosTerms,
      })

      toast.success("Shipping details saved, status updated to In Transit")
      onComplete?.()
    } catch (error) {
      console.error("[v0] Error updating shipping info:", error)
      toast.error("Failed to save shipping details")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitClearing = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updatePostDealInfo(procurementId, {
        clearing_date: formData.clearingDate,
        license_plate_number: formData.licensePlateNumber,
        customs_documents: formData.customsDocuments,
        tdo_obtained: formData.tdoObtained,
        idec_waiver_valid: formData.idecWaiverValid,
        received_by: formData.receivedBy,
        received_at: formData.receivedAt,
      })

      toast.success("Clearing details saved, ready for onboarding")
      onComplete?.()
    } catch (error) {
      console.error("[v0] Error updating clearing info:", error)
      toast.error("Failed to save clearing details")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (currentStatus === "Deal Closed") {
    return (
      <form onSubmit={handleSubmitShipping} className="space-y-4 w-full">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-4">
              <Label className="text-sm font-medium">Upload Required Documents (Before Payment)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Bill of Lading */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Bill of Lading *</Label>
                  {formData.billOfLadingUrl ? (
                    <div className="flex items-center gap-2 p-2 border rounded bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-green-600">Uploaded</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, billOfLadingUrl: "" })}
                        className="ml-auto h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      disabled={uploading}
                      onClick={() => document.getElementById("bol-upload")?.click()}
                    >
                      <Upload className="h-3 w-3 mr-2" />
                      Upload
                    </Button>
                  )}
                  <input
                    type="file"
                    id="bol-upload"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] && handleFileUpload(e.target.files[0], "billOfLadingUrl", "Bill of Lading")
                    }
                  />
                </div>

                {/* Packing List */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Packing List *</Label>
                  {formData.packingListUrl ? (
                    <div className="flex items-center gap-2 p-2 border rounded bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-green-600">Uploaded</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, packingListUrl: "" })}
                        className="ml-auto h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      disabled={uploading}
                      onClick={() => document.getElementById("pl-upload")?.click()}
                    >
                      <Upload className="h-3 w-3 mr-2" />
                      Upload
                    </Button>
                  )}
                  <input
                    type="file"
                    id="pl-upload"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] && handleFileUpload(e.target.files[0], "packingListUrl", "Packing List")
                    }
                  />
                </div>

                {/* Commercial Invoice */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Commercial Invoice (Final) *</Label>
                  {formData.commercialInvoiceUrl ? (
                    <div className="flex items-center gap-2 p-2 border rounded bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-green-600">Uploaded</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, commercialInvoiceUrl: "" })}
                        className="ml-auto h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      disabled={uploading}
                      onClick={() => document.getElementById("ci-upload")?.click()}
                    >
                      <Upload className="h-3 w-3 mr-2" />
                      Upload
                    </Button>
                  )}
                  <input
                    type="file"
                    id="ci-upload"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] &&
                      handleFileUpload(e.target.files[0], "commercialInvoiceUrl", "Commercial Invoice")
                    }
                  />
                </div>

                {/* Receipt */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Receipt *</Label>
                  {formData.receiptUrl ? (
                    <div className="flex items-center gap-2 p-2 border rounded bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-green-600">Uploaded</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, receiptUrl: "" })}
                        className="ml-auto h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      disabled={uploading}
                      onClick={() => document.getElementById("receipt-upload")?.click()}
                    >
                      <Upload className="h-3 w-3 mr-2" />
                      Upload
                    </Button>
                  )}
                  <input
                    type="file"
                    id="receipt-upload"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] && handleFileUpload(e.target.files[0], "receiptUrl", "Receipt")
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                Shipping & Tracking Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Shipping Tracking No. *</Label>
                  <Input
                    value={formData.shippingTrackingNo}
                    onChange={(e) => setFormData({ ...formData, shippingTrackingNo: e.target.value })}
                    placeholder="Enter tracking number"
                    required
                  />
                </div>
                <div>
                  <Label>Waybill Number *</Label>
                  <Input
                    value={formData.waybillNumber}
                    onChange={(e) => setFormData({ ...formData, waybillNumber: e.target.value })}
                    placeholder="Waybill/Bill of Lading"
                    required
                  />
                </div>
                <div>
                  <Label>Shipping Date *</Label>
                  <Input
                    type="date"
                    value={formData.shippingDate}
                    onChange={(e) => setFormData({ ...formData, shippingDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Estimated Delivery (Months) *</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.estimatedMonths}
                    onChange={(e) => setFormData({ ...formData, estimatedMonths: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cifLagos"
                  checked={formData.cifLagosTerms}
                  onCheckedChange={(checked) => setFormData({ ...formData, cifLagosTerms: checked as boolean })}
                />
                <label htmlFor="cifLagos" className="text-sm cursor-pointer">
                  Vehicle shipped under CIF Lagos terms
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting} className="w-full bg-accent hover:bg-accent/90">
          {isSubmitting ? "Saving..." : "Save Shipping Details & Mark as In Transit"}
        </Button>
      </form>
    )
  }

  if (currentStatus === "Clearing") {
    return (
      <form onSubmit={handleSubmitClearing} className="space-y-4 w-full">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Customs & Clearing Details
            </h3>

            <div className="space-y-4 border-b pb-4">
              <Label className="text-sm font-medium">Clearing Documentation</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Customs Duty Receipt */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Customs Duty Receipt *</Label>
                  {formData.customDutyReceiptUrl ? (
                    <div className="flex items-center gap-2 p-2 border rounded bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-green-600">Uploaded</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, customDutyReceiptUrl: "" })}
                        className="ml-auto h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      disabled={uploading}
                      onClick={() => document.getElementById("cdr-upload")?.click()}
                    >
                      <Upload className="h-3 w-3 mr-2" />
                      Upload
                    </Button>
                  )}
                  <input
                    type="file"
                    id="cdr-upload"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] &&
                      handleFileUpload(e.target.files[0], "customDutyReceiptUrl", "Customs Duty Receipt")
                    }
                  />
                </div>

                {/* Release Order */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Release Order *</Label>
                  {formData.releaseOrderUrl ? (
                    <div className="flex items-center gap-2 p-2 border rounded bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-green-600">Uploaded</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, releaseOrderUrl: "" })}
                        className="ml-auto h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      disabled={uploading}
                      onClick={() => document.getElementById("ro-upload")?.click()}
                    >
                      <Upload className="h-3 w-3 mr-2" />
                      Upload
                    </Button>
                  )}
                  <input
                    type="file"
                    id="ro-upload"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] && handleFileUpload(e.target.files[0], "releaseOrderUrl", "Release Order")
                    }
                  />
                </div>

                {/* Terminal Delivery Order (TDO) */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Terminal Delivery Order (TDO) *</Label>
                  {formData.tdoUrl ? (
                    <div className="flex items-center gap-2 p-2 border rounded bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-green-600">Uploaded</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, tdoUrl: "", tdoObtained: false })}
                        className="ml-auto h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      disabled={uploading}
                      onClick={() => document.getElementById("tdo-upload")?.click()}
                    >
                      <Upload className="h-3 w-3 mr-2" />
                      Upload
                    </Button>
                  )}
                  <input
                    type="file"
                    id="tdo-upload"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0], "tdoUrl", "Terminal Delivery Order")
                        setFormData((prev) => ({ ...prev, tdoObtained: true }))
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Clearing Date *</Label>
                <Input
                  type="date"
                  value={formData.clearingDate}
                  onChange={(e) => setFormData({ ...formData, clearingDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>License Plate Number *</Label>
                <Input
                  value={formData.licensePlateNumber}
                  onChange={(e) => setFormData({ ...formData, licensePlateNumber: e.target.value })}
                  placeholder="e.g., ABC-123-XY"
                  required
                />
              </div>
              <div className="col-span-2">
                <Label>Customs Documents & Duty Payments Notes</Label>
                <Textarea
                  value={formData.customsDocuments}
                  onChange={(e) => setFormData({ ...formData, customsDocuments: e.target.value })}
                  placeholder="Document reference numbers, taxes paid, levies..."
                  rows={3}
                  required
                />
              </div>
              <div>
                <Label>Received By (From Clearing Agent) *</Label>
                <Input
                  value={formData.receivedBy}
                  onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
                  placeholder="Staff name"
                  required
                />
              </div>
              <div>
                <Label>Received Date *</Label>
                <Input
                  type="date"
                  value={formData.receivedAt}
                  onChange={(e) => setFormData({ ...formData, receivedAt: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="idecWaiver"
                  checked={formData.idecWaiverValid}
                  onCheckedChange={(checked) => setFormData({ ...formData, idecWaiverValid: checked as boolean })}
                />
                <label htmlFor="idecWaiver" className="text-sm cursor-pointer">
                  IDEC Waiver Valid
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting} className="w-full bg-accent hover:bg-accent/90">
          {isSubmitting ? "Saving..." : "Complete Clearing & Move to Onboarding"}
        </Button>
      </form>
    )
  }

  return null
}
