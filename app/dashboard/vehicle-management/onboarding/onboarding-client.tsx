"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus } from 'lucide-react'
import { OnboardingTable } from "@/components/onboarding/onboarding-table"
import { OnboardingDetailSheet } from "@/components/onboarding/onboarding-detail-sheet"

export function OnboardingClient() {
  const [search, setSearch] = useState("")
  const [selectedOnboarding, setSelectedOnboarding] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicle Onboarding</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage vehicle onboarding process
          </p>
        </div>
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
