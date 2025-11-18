"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, AlertTriangle, CheckCircle, Clock, TruckIcon } from 'lucide-react'
import { useState } from "react"
import { IncidentsTable } from "@/components/incidents/incidents-table"
import { CreateIncidentDialog } from "@/components/incidents/create-incident-dialog"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

export function IncidentsClient() {
  const [showCreate, setShowCreate] = useState(false)
  const supabase = createClient()

  const { data: stats, mutate } = useSWR("incident-stats", async () => {
    const { data } = await supabase.from("incidents").select("*")
    const open = data?.filter((i) => i.status === "Open").length || 0
    const closed = data?.filter((i) => i.status === "Closed").length || 0
    const insurance = data?.filter((i) => i.status === "Insurance").length || 0
    const tow = data?.filter((i) => i.status === "Tow").length || 0

    return { total: data?.length || 0, open, closed, insurance, tow }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Incident Management</h1>
          <p className="text-muted-foreground">Track and manage fleet incidents</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-accent hover:bg-accent/90">
          <Plus className="h-4 w-4 mr-2" />
          Report Incident
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.open || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insurance</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.insurance || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tow</CardTitle>
            <TruckIcon className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tow || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.closed || 0}</div>
          </CardContent>
        </Card>
      </div>

      <IncidentsTable onUpdate={() => mutate()} />

      {showCreate && (
        <CreateIncidentDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          onSuccess={() => {
            mutate()
            setShowCreate(false)
          }}
        />
      )}
    </div>
  )
}
