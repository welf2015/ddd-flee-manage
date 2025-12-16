"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient as createClientAction, updateClient } from "@/app/actions/clients"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type CreateClientDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  client?: any
  onSuccess?: () => void
}

export function CreateClientDialog({ open: controlledOpen, onOpenChange, client, onSuccess }: CreateClientDialogProps = {}) {
  const isEditing = !!client
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
  })
  const router = useRouter()

  useEffect(() => {
    if (open) {
      if (client) {
        setFormData({
          name: client.name || "",
          contact_name: client.contact_name || "",
          email: client.email || "",
          phone: client.phone || "",
          address: client.address || "",
        })
      } else {
        setFormData({
          name: "",
          contact_name: "",
          email: "",
          phone: "",
          address: "",
        })
      }
    }
  }, [open, client])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    if (isEditing && client) {
      // Update existing client
      const result = await updateClient(client.id, formData)

      if (result.success) {
        toast.success("Client updated successfully")
        setOpen(false)
        onSuccess?.()
        router.refresh()
      } else {
        toast.error(result.error || "Failed to update client")
      }
    } else {
      // Create new client
      const formDataObj = new FormData()
      formDataObj.set("name", formData.name)
      formDataObj.set("contact_name", formData.contact_name)
      formDataObj.set("email", formData.email)
      formDataObj.set("phone", formData.phone)
      formDataObj.set("address", formData.address)

      const result = await createClientAction(formDataObj)

      if (result.success) {
        toast.success("Client created successfully")
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to create client")
      }
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEditing && (
        <DialogTrigger asChild>
          <Button className="bg-accent hover:bg-accent/90">
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Client" : "Add New Client"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update client information" : "Add a new client to your database"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="ABC Logistics Ltd"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact_name">Contact Person *</Label>
              <Input
                id="contact_name"
                name="contact_name"
                placeholder="John Doe"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="+234 800 000 0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                placeholder="Business address"
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={loading}>
              {loading ? (isEditing ? "Saving..." : "Adding...") : (isEditing ? "Save" : "Add Client")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
