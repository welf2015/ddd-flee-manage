"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import useSWR from "swr"

type CollectionLogDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CollectionLogDialog({ open, onOpenChange, onSuccess }: CollectionLogDialogProps) {
  const [collectorName, setCollectorName] = useState("")
  const [itemName, setItemName] = useState("")
  const [itemDescription, setItemDescription] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [approvedBy, setApprovedBy] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  // Fetch current user for auto-filling approved_by
  const { data: currentUser } = useSWR(
    "current-user",
    async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("id", user.id)
          .single()
        return profile
      }
      return null
    },
    { revalidateOnMount: true }
  )

  // Fetch profiles for approved by dropdown
  const { data: profiles = [] } = useSWR(
    "profiles-list",
    async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .order("full_name", { ascending: true })
      return data || []
    }
  )

  useEffect(() => {
    if (currentUser && !approvedBy) {
      setApprovedBy(currentUser.id)
    }
  }, [currentUser, approvedBy])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("You must be logged in to create a collection log")
        return
      }

      const approvedByProfile = profiles.find((p) => p.id === approvedBy)

      const { error } = await supabase.from("inventory_collections").insert({
        collector_name: collectorName.trim(),
        item_name: itemName.trim(),
        item_description: itemDescription.trim() || null,
        quantity: parseInt(quantity) || 1,
        approved_by: approvedBy || null,
        approved_by_name: approvedByProfile?.full_name || null,
        notes: notes.trim() || null,
        created_by: user.id,
      })

      if (error) {
        console.error("Error creating collection log:", error)
        toast.error("Failed to create collection log")
        return
      }

      toast.success("Collection log created successfully")
      onSuccess()
      handleReset()
      onOpenChange(false)
    } catch (error) {
      console.error("Error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setCollectorName("")
    setItemName("")
    setItemDescription("")
    setQuantity("1")
    setApprovedBy(currentUser?.id || "")
    setNotes("")
  }

  const handleClose = () => {
    handleReset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Log Collection</DialogTitle>
          <DialogDescription>
            Record when a driver or person collects an item from inventory
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="collector-name">Collector Name *</Label>
              <Input
                id="collector-name"
                placeholder="Enter collector's name"
                value={collectorName}
                onChange={(e) => setCollectorName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-name">Item Name *</Label>
              <Input
                id="item-name"
                placeholder="Enter item name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-description">Item Description</Label>
              <Textarea
                id="item-description"
                placeholder="Optional description"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="approved-by">Approved By *</Label>
              <Select value={approvedBy} onValueChange={setApprovedBy} required>
                <SelectTrigger id="approved-by">
                  <SelectValue placeholder="Select approver" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.full_name} {profile.role ? `(${profile.role})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Optional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Log"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

