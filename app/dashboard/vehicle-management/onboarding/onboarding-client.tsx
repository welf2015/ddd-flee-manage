"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus } from "lucide-react"
import { OnboardingTable } from "@/components/onboarding/onboarding-table"
import { OnboardingDetailSheet } from "@/components/onboarding/onboarding-detail-sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createManualOnboarding } from "@/app/actions/onboarding"
import { toast } from "sonner"

export function OnboardingClient() {
  const [search, setSearch] = useState("")
  const [selectedOnboarding, setSelectedOnboarding] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreating(true)
    const formData = new FormData(e.currentTarget)

    try {
      const result = await createManualOnboarding(formData)
      if (result.success) {
        toast.success("Onboarding started successfully")
        setCreateOpen(false)
      } else {
        toast.error(result.error || "Failed to start onboarding")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicle Onboarding</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage vehicle onboarding process</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Start Onboarding
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Vehicle Onboarding</DialogTitle>
              <DialogDescription>Manually add a vehicle to the onboarding process.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="vehicle_number">Vehicle Number</Label>
                  <Input id="vehicle_number" name="vehicle_number" placeholder="e.g. ABC-123-XY" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vehicle_type">Vehicle Type</Label>
                  <Select name="vehicle_type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Truck">Truck</SelectItem>
                      <SelectItem value="Van">Van</SelectItem>
                      <SelectItem value="Car">Car</SelectItem>
                      <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="make">Make</Label>
                    <Input id="make" name="make" placeholder="e.g. Toyota" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="model">Model</Label>
                    <Input id="model" name="model" placeholder="e.g. Hilux" required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" name="year" type="number" placeholder="2024" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" placeholder="Additional details..." />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="bg-accent hover:bg-accent/90">
                  {creating ? "Creating..." : "Start Onboarding"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-background/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Onboarding Progress</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-[300px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by vehicle number..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <OnboardingTable search={search} onViewDetails={setSelectedOnboarding} />
        </CardContent>
      </Card>

      {selectedOnboarding && (
        <OnboardingDetailSheet
          onboardingId={selectedOnboarding}
          open={!!selectedOnboarding}
          onClose={() => setSelectedOnboarding(null)}
        />
      )}
    </div>
  )
}
