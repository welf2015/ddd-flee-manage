"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ClientsTable } from "@/components/clients-table"
import { CreateClientDialog } from "@/components/create-client-dialog"
import { ClientStats } from "@/components/client-stats"
import { ClientCRMPanel } from "@/components/client-crm-panel"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

type ClientsPageClientProps = {
  clients: any[]
  clientBookingMap: { [key: string]: number }
  stats: { total: number; topClients: number; newThisMonth: number }
  onSignOut: () => void
}

export function ClientsPageClient({ clients, clientBookingMap, stats, onSignOut }: ClientsPageClientProps) {
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [clientBookings, setClientBookings] = useState<any[]>([])

  const handleViewClient = async (client: any) => {
    const supabase = createClient()

    // Fetch bookings for this client
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })

    setSelectedClient(client)
    setClientBookings(bookings || [])
  }

  const totalRevenue = clientBookings.reduce((sum, booking) => sum + (booking.proposed_client_budget || 0), 0)

  const bookingMap = new Map(Object.entries(clientBookingMap).map(([k, v]) => [k, v as number]))

  return (
    <DashboardLayout onSignOut={onSignOut}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-sm text-muted-foreground">Manage client relationships and booking history</p>
        </div>
        <CreateClientDialog />
      </div>

      <ClientStats {...stats} />

      <ClientsTable clients={clients} clientBookings={bookingMap} onViewClient={handleViewClient} />

      <ClientCRMPanel
        open={!!selectedClient}
        onOpenChange={(open) => !open && setSelectedClient(null)}
        client={selectedClient}
        bookings={clientBookings}
        totalRevenue={totalRevenue}
      />
    </DashboardLayout>
  )
}
