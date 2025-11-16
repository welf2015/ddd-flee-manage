"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

type CreateVendorDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateVendorDialog({ open, onOpenChange }: CreateVendorDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Not authenticated")
      setIsLoading(false)
      return
    }

    const formData = new FormData(e.currentTarget)

    const { error } = await supabase.from("vendors").insert({
      name: formData.get("name"),
      contact_name: formData.get("contact_name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      city: formData.get("city"),
      country: formData.get("country"),
      bank_details: formData.get("bank_details"),
      created_by: user.id,
    })

    setIsLoading(false)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Vendor created successfully")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Vendor Name</Label>
            <Input name="name" placeholder="Company name" required />
          </div>

          <div>
            <Label htmlFor="contact_name">Contact Name</Label>
            <Input name="contact_name" placeholder="Contact person" />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input name="email" type="email" placeholder="email@example.com" />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input name="phone" placeholder="+234..." />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input name="address" placeholder="Street address" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input name="city" placeholder="City" />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input name="country" placeholder="Country" />
            </div>
          </div>

          <div>
            <Label htmlFor="bank_details">Bank Details</Label>
            <Textarea name="bank_details" placeholder="Bank account details" />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90">
            {isLoading ? "Creating..." : "Add Vendor"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
