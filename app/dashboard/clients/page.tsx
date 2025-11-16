import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ClientsPageClient } from "@/components/clients-page-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Clients",
  description: "Manage client relationships and history",
}

export default async function ClientsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: clients, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching clients:", error)
  }

  const { data: bookingCounts } = await supabase.from("bookings").select("client_id").not("client_id", "is", null)

  // Count bookings per client
  const clientBookingMap = new Map<string, number>()
  bookingCounts?.forEach((b) => {
    if (b.client_id) {
      clientBookingMap.set(b.client_id, (clientBookingMap.get(b.client_id) || 0) + 1)
    }
  })

  // Clients with 3+ bookings are considered "top clients"
  const topClientsCount = Array.from(clientBookingMap.values()).filter((count) => count >= 3).length

  // New clients this month
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const newThisMonth = clients?.filter((c) => new Date(c.created_at) >= firstDayOfMonth).length || 0

  const stats = {
    total: clients?.length || 0,
    topClients: topClientsCount,
    newThisMonth,
  }

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  return (
    <ClientsPageClient
      clients={clients || []}
      clientBookingMap={Object.fromEntries(clientBookingMap)}
      stats={stats}
      onSignOut={handleSignOut}
    />
  )
}
