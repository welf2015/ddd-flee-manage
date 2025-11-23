"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { updatePostDealInfo, uploadProcurementDocument } from "@/app/actions/procurement"
import { FileText, Package, FileCheck, Upload } from "lucide-react"
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
    invoiceUrl: "",
    receiptUrl: "",
    soncapUrl: "",
    naddcUrl: "",
    formMUrl: "",
    customDutyReceiptUrl: "",
    releaseOrderUrl: "",
    billOfLadingUrl: "",
    packingListUrl: "",
    commercialInvoiceUrl: "",
    receivedAt: "", // Added receivedAt to state
  })

  const handleFileUpload = async (file: File, fieldName: string, docType: string) => {
    setUploading(true)
    try {
      const configRes = await fetch("/api/upload")
      if (!configRes.ok) {
        throw new Error("Upload service not configured")
      }

      const { workerUrl, authKey } = await configRes.json()

      const formDataUpload = new FormData()
      formDataUpload.append("file", file)
      formDataUpload.append("folder", `procurement-documents/${procurementId}`)

      const response = await fetch(workerUrl, {
        method: "POST",
        headers: {
          "X-Auth-Key": authKey,
        },
        body: formDataUpload,
      })

      if (!response.ok) throw new Error("Upload failed")

      const { url } = await response.json()
      // @ts-ignore - dynamic key access
      setFormData({ ...formData, [fieldName]: url })

      // Automatically save the document record
      await uploadProcurementDocument(procurementId, file.name, url, docType)

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

      toast.success("Shipping details saved")
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
        received_by: formData.receivedBy, // Added receiver details
        received_at: formData.receivedAt, // Added receiver details
      })

      toast.success("Clearing details saved")
      onComplete?.()
    } catch (error) {
      console.error("[v0] Error updating clearing info:", error)
      toast.error("Failed to save clearing details")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitArrival = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updatePostDealInfo(procurementId, {
        condition_on_arrival: formData.conditionOnArrival,
        warranty_details: formData.warrantyDetails,
        received_by: formData.receivedBy,
      })

      toast.success("Arrival details saved")
      onComplete?.()
    } catch (error) {
      console.error("[v0] Error updating arrival info:", error)
      toast.error("Failed to save arrival details")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show appropriate form based on current status
  if (currentStatus === "Deal Closed") {
    return (
      <form onSubmit={handleSubmitShipping} className="space-y-4 w-full">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Shipping & Tracking Information
            </h3>

            <div className="col-span-2 space-y-4 border-b pb-4">
              <Label className="text-sm font-medium">Post-Payment Documents</Label>
              <div className="grid grid-cols-3 gap-3">
                {/* SONCAP Upload */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">SONCAP</Label>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploading}
                      className={formData.soncapUrl ? "border-green-500 text-green-600" : ""}
                      onClick={() => document.getElementById("soncap-upload")?.click()}
                    >
                      <Upload className="h-3 w-3 mr-2" />
                      {formData.soncapUrl ? "Uploaded" : "Upload"}
                    </Button>
                    <input
                      type="file"
                      id="soncap-upload"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files?.[0] && handleFileUpload(e.target.files[0], "soncapUrl", "SONCAP")
                      }
                    />
                  </div>
                </div>

                {/* NADDC Upload */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">NADDC</Label>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploading}
                      className={formData.naddcUrl ? "border-green-500 text-green-600" : ""}
                      onClick={() => document.getElementById("naddc-upload")?.click()}
                    >
                      <Upload className="h-3 w-3 mr-2" />
                      {formData.naddcUrl ? "Uploaded" : "Upload"}
                    </Button>
                    <input
                      type="file"
                      id="naddc-upload"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "naddcUrl", "NADDC")}
                    />
                  </div>
                </div>

                {/* Form M Upload */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Form M</Label>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploading}
                      className={formData.formMUrl ? "border-green-500 text-green-600" : ""}
                      onClick={() => document.getElementById("formm-upload")?.click()}
                    >
                      <Upload className="h-3 w-3 mr-2" />
                      {formData.formMUrl ? "Uploaded" : "Upload"}
                    </Button>
                    <input
                      type="file"
                      id="formm-upload"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "formMUrl", "Form M")}
                    />
                  </div>
                </div>
              </div>
            </div>

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
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting} className="w-full bg-accent hover:bg-accent/90">
          {isSubmitting ? "Saving..." : "Save Shipping Details & Move to Payment"}
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
                {/* Custom Duty Receipt */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Custom Duty Receipt</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`w-full ${formData.customDutyReceiptUrl ? "border-green-500 text-green-600" : ""}`}
                    onClick={() => document.getElementById("cdr-upload")?.click()}
                  >
                    <Upload className="h-3 w-3 mr-2" />
                    {formData.customDutyReceiptUrl ? "Uploaded" : "Upload"}
                  </Button>
                  <input
                    type="file"
                    id="cdr-upload"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] &&
                      handleFileUpload(e.target.files[0], "customDutyReceiptUrl", "Custom Duty Receipt")
                    }
                  />
                </div>

                {/* Release Order */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Release Order</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`w-full ${formData.releaseOrderUrl ? "border-green-500 text-green-600" : ""}`}
                    onClick={() => document.getElementById("ro-upload")?.click()}
                  >
                    <Upload className="h-3 w-3 mr-2" />
                    {formData.releaseOrderUrl ? "Uploaded" : "Upload"}
                  </Button>
                  <input
                    type="file"
                    id="ro-upload"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] && handleFileUpload(e.target.files[0], "releaseOrderUrl", "Release Order")
                    }
                  />
                </div>

                {/* Terminal Delivery Order */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Terminal Delivery Order (TDO)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`w-full ${formData.tdoObtained ? "border-green-500 text-green-600" : ""}`}
                    onClick={() => document.getElementById("tdo-file-upload")?.click()}
                  >
                    <Upload className="h-3 w-3 mr-2" />
                    {formData.tdoObtained ? "Uploaded" : "Upload"}
                  </Button>
                  <input
                    type="file"
                    id="tdo-file-upload"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0], "tdoObtained", "Terminal Delivery Order")
                        setFormData((prev) => ({ ...prev, tdoObtained: true }))
                      }
                    }}
                  />
                </div>

                {/* Bill of Lading */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Bill of Lading</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`w-full ${formData.billOfLadingUrl ? "border-green-500 text-green-600" : ""}`}
                    onClick={() => document.getElementById("bol-upload")?.click()}
                  >
                    <Upload className="h-3 w-3 mr-2" />
                    {formData.billOfLadingUrl ? "Uploaded" : "Upload"}
                  </Button>
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
                  <Label className="text-xs text-muted-foreground">Packing List</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`w-full ${formData.packingListUrl ? "border-green-500 text-green-600" : ""}`}
                    onClick={() => document.getElementById("pl-upload")?.click()}
                  >
                    <Upload className="h-3 w-3 mr-2" />
                    {formData.packingListUrl ? "Uploaded" : "Upload"}
                  </Button>
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
                  <Label className="text-xs text-muted-foreground">Commercial Invoice</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`w-full ${formData.commercialInvoiceUrl ? "border-green-500 text-green-600" : ""}`}
                    onClick={() => document.getElementById("ci-upload")?.click()}
                  >
                    <Upload className="h-3 w-3 mr-2" />
                    {formData.commercialInvoiceUrl ? "Uploaded" : "Upload"}
                  </Button>
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
                  placeholder="Name of person receiving goods"
                  required
                />
              </div>
              <div>
                <Label>Date Received *</Label>
                <Input
                  type="datetime-local"
                  value={formData.receivedAt}
                  onChange={(e) => setFormData({ ...formData, receivedAt: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tdoObtained"
                  checked={formData.tdoObtained}
                  onCheckedChange={(checked) => setFormData({ ...formData, tdoObtained: checked as boolean })}
                />
                <label htmlFor="tdoObtained" className="text-sm cursor-pointer">
                  Terminal Delivery Order (TDO) obtained *
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="idecWaiver"
                  checked={formData.idecWaiverValid}
                  onCheckedChange={(checked) => setFormData({ ...formData, idecWaiverValid: checked as boolean })}
                />
                <label htmlFor="idecWaiver" className="text-sm cursor-pointer">
                  IDEC Waiver processed or valid *
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting || uploading} className="w-full bg-accent hover:bg-accent/90">
          {isSubmitting ? "Saving..." : "Complete Clearing & Enable Arrival Details"}
        </Button>
      </form>
    )
  }

  if (currentStatus === "Ready for Onboarding") {
    return (
      <form onSubmit={handleSubmitArrival} className="space-y-4 w-full">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Vehicle Arrival Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Condition on Arrival *</Label>
                <Textarea
                  value={formData.conditionOnArrival}
                  onChange={(e) => setFormData({ ...formData, conditionOnArrival: e.target.value })}
                  placeholder="Describe vehicle condition, any damages, issues..."
                  rows={3}
                  required
                />
              </div>
              <div>
                <Label>Warranty Details</Label>
                <Textarea
                  value={formData.warrantyDetails}
                  onChange={(e) => setFormData({ ...formData, warrantyDetails: e.target.value })}
                  placeholder="Duration, coverage, terms..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Received By (Name & Signature) *</Label>
                <Input
                  value={formData.receivedBy}
                  onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
                  placeholder="Name of receiving officer"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting} className="w-full bg-accent hover:bg-accent/90">
          {isSubmitting ? "Saving..." : "Save Arrival Details"}
        </Button>
      </form>
    )
  }

  return null
}
