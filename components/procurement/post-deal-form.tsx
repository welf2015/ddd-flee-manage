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
  })

  const handleFileUpload = async (file: File, fieldName: "invoiceUrl" | "receiptUrl") => {
    setUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append("file", file)
      formDataUpload.append("folder", `procurement-documents/${procurementId}`)

      const response = await fetch("/api/r2-upload", {
        method: "POST",
        body: formDataUpload,
      })

      if (!response.ok) throw new Error("Upload failed")

      const { url } = await response.json()
      setFormData({ ...formData, [fieldName]: url })
      toast.success("Document uploaded successfully")
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
      })

      if (formData.invoiceUrl) {
        await uploadProcurementDocument(procurementId, "Invoice", formData.invoiceUrl, "Invoice")
      }
      if (formData.receiptUrl) {
        await uploadProcurementDocument(procurementId, "Receipt", formData.receiptUrl, "Receipt")
      }

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
                <Label>Customs Documents & Duty Payments *</Label>
                <Textarea
                  value={formData.customsDocuments}
                  onChange={(e) => setFormData({ ...formData, customsDocuments: e.target.value })}
                  placeholder="Document reference numbers, taxes paid, levies..."
                  rows={3}
                  required
                />
              </div>
              <div>
                <Label>Invoice Upload</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="invoice-upload"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0], "invoiceUrl")
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => document.getElementById("invoice-upload")?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {formData.invoiceUrl ? "Change Invoice" : "Upload Invoice"}
                  </Button>
                  {formData.invoiceUrl && (
                    <a
                      href={formData.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-accent hover:underline"
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
              <div>
                <Label>Receipt Upload</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="receipt-upload"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0], "receiptUrl")
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => document.getElementById("receipt-upload")?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {formData.receiptUrl ? "Change Receipt" : "Upload Receipt"}
                  </Button>
                  {formData.receiptUrl && (
                    <a
                      href={formData.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-accent hover:underline"
                    >
                      View
                    </a>
                  )}
                </div>
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
