"use client"

import type React from "react"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { updateClearingAgent } from "@/app/actions/clearing-agents"

type EditClearingAgentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  agentId: string | null
  onAgentUpdated?: () => void
}

export function EditClearingAgentDialog({ open, onOpenChange, agentId, onAgentUpdated }: EditClearingAgentDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    license_number: "",
  })
  const supabase = createClient()

  useEffect(() => {
    if (agentId && open) {
      // Fetch agent data
      const fetchAgent = async () => {
        const { data } = await supabase.from("clearing_agents").select("*").eq("id", agentId).single()

        if (data) {
          setFormData({
            name: data.name || "",
            contact_name: data.contact_name || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            license_number: data.license_number || "",
          })
        }
      }
      fetchAgent()
    }
  }, [agentId, open, supabase])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!agentId) return

    setIsLoading(true)

    const result = await updateClearingAgent(agentId, formData)

    setIsLoading(false)

    if (result.success) {
      toast.success("Clearing agent updated successfully")
      onAgentUpdated?.()
      onOpenChange(false)
    } else {
      toast.error(result.error || "Failed to update clearing agent")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Clearing Agent</DialogTitle>
          <DialogDescription>Update clearing agent details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Agent Name</Label>
            <Input
              name="name"
              placeholder="Company name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="contact_name">Contact Name</Label>
            <Input
              name="contact_name"
              placeholder="Contact person"
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="license_number">License Number</Label>
            <Input
              name="license_number"
              placeholder="License #"
              required
              value={formData.license_number}
              onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              name="email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              name="phone"
              placeholder="+234..."
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              name="address"
              placeholder="Office address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90">
            {isLoading ? "Updating..." : "Update Clearing Agent"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
