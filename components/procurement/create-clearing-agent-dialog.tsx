"use client"

import type React from "react"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { mutate } from "swr"

type CreateClearingAgentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateClearingAgentDialog({ open, onOpenChange }: CreateClearingAgentDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const form = e.currentTarget
    const formData = new FormData(form)

    setIsLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Not authenticated")
      setIsLoading(false)
      return
    }

    const { error } = await supabase.from("clearing_agents").insert({
      name: formData.get("name"),
      contact_name: formData.get("contact_name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      license_number: formData.get("license_number"),
      created_by: user.id,
    })

    setIsLoading(false)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Clearing agent added successfully")
      mutate("clearing-agents")
      form.reset()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Clearing Agent</DialogTitle>
          <DialogDescription>Add a new port clearing agent for vehicle imports</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Agent Name</Label>
            <Input name="name" placeholder="Company name" required />
          </div>

          <div>
            <Label htmlFor="contact_name">Contact Name</Label>
            <Input name="contact_name" placeholder="Contact person" />
          </div>

          <div>
            <Label htmlFor="license_number">License Number</Label>
            <Input name="license_number" placeholder="License #" required />
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
            <Input name="address" placeholder="Office address" />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90">
            {isLoading ? "Adding..." : "Add Clearing Agent"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
