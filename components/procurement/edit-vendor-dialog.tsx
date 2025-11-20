"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

interface EditVendorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendorId: string | null
  onVendorUpdated?: () => void
}

const COUNTRIES = [
  { name: "Nigeria", code: "+234", flag: "🇳🇬" },
  { name: "United States", code: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { name: "Germany", code: "+49", flag: "🇩🇪" },
  { name: "Japan", code: "+81", flag: "🇯🇵" },
  { name: "China", code: "+86", flag: "🇨🇳" },
  { name: "France", code: "+33", flag: "🇫🇷" },
  { name: "Italy", code: "+39", flag: "🇮🇹" },
  { name: "South Korea", code: "+82", flag: "🇰🇷" },
  { name: "India", code: "+91", flag: "🇮🇳" },
  { name: "UAE", code: "+971", flag: "🇦🇪" },
  { name: "South Africa", code: "+27", flag: "🇿🇦" },
  { name: "Ghana", code: "+233", flag: "🇬🇭" },
  { name: "Kenya", code: "+254", flag: "🇰🇪" },
  { name: "Brazil", code: "+55", flag: "🇧🇷" },
  { name: "Canada", code: "+1", flag: "🇨🇦" },
  { name: "Australia", code: "+61", flag: "🇦🇺" },
]

export function EditVendorDialog({ open, onOpenChange, vendorId, onVendorUpdated }: EditVendorDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    bankDetails: "",
  })

  useEffect(() => {
    if (vendorId && open) {
      loadVendorData()
    }
  }, [vendorId, open])

  const loadVendorData = async () => {
    if (!vendorId) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("vendors").select("*").eq("id", vendorId).single()

      if (error) throw error

      if (data) {
        setFormData({
          name: data.name || "",
          contactName: data.contact_name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          country: data.country || "",
          bankDetails: data.bank_details || "",
        })
      }
    } catch (error) {
      console.error("Error loading vendor:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCountry = COUNTRIES.find((c) => c.name === formData.country)
  const phonePrefix = selectedCountry?.code || ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendorId || !formData.name || !formData.country) return

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("vendors")
        .update({
          name: formData.name,
          contact_name: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          bank_details: formData.bankDetails,
        })
        .eq("id", vendorId)

      if (error) throw error

      onVendorUpdated?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating vendor:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="text-center py-8">Loading vendor details...</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vendor</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Vendor Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Company name"
                required
              />
            </div>

            <div>
              <Label>Contact Person</Label>
              <Input
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="Full name"
              />
            </div>

            <div>
              <Label>Country *</Label>
              <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.name} value={country.name}>
                      <span className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span>{country.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="vendor@example.com"
              />
            </div>

            <div>
              <Label>Phone</Label>
              <div className="flex gap-2">
                <Input value={phonePrefix} disabled className="w-20 bg-muted" placeholder="+..." />
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="col-span-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
              />
            </div>

            <div>
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City name"
              />
            </div>

            <div className="col-span-2">
              <Label>Bank Details (Optional)</Label>
              <Textarea
                value={formData.bankDetails}
                onChange={(e) => setFormData({ ...formData, bankDetails: e.target.value })}
                placeholder="Bank name, account number, etc."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
