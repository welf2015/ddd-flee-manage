"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { mutate } from "swr"
import { toast } from "sonner"

interface AddVendorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVendorAdded?: () => void
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
  { name: "Netherlands", code: "+31", flag: "🇳🇱" },
  { name: "Belgium", code: "+32", flag: "🇧🇪" },
  { name: "Spain", code: "+34", flag: "🇪🇸" },
  { name: "Mexico", code: "+52", flag: "🇲🇽" },
  { name: "Thailand", code: "+66", flag: "🇹🇭" },
  { name: "Malaysia", code: "+60", flag: "🇲🇾" },
  { name: "Indonesia", code: "+62", flag: "🇮🇩" },
]

export function AddVendorDialog({ open, onOpenChange, onVendorAdded }: AddVendorDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const selectedCountry = COUNTRIES.find((c) => c.name === formData.country)
  const phonePrefix = selectedCountry?.code || ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.country) return

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("vendors").insert({
        name: formData.name,
        contact_name: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        bank_details: formData.bankDetails,
      })

      if (error) throw error

      toast.success("Vendor added successfully")
      mutate("vendors")
      onVendorAdded?.()
      setFormData({
        name: "",
        contactName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        country: "",
        bankDetails: "",
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error adding vendor:", error)
      toast.error("Failed to add vendor")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>Add a new vehicle vendor or supplier</DialogDescription>
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
              {formData.country && (
                <p className="text-xs text-muted-foreground mt-1">Format: {phonePrefix} followed by the local number</p>
              )}
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
              <p className="text-xs text-red-500 mb-2">* No personal account allowed. Company account required.</p>
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
              {isSubmitting ? "Adding..." : "Add Vendor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
