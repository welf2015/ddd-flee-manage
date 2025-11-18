import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { BookingsTable } from "@/components/bookings-table"
import { CreateBookingDialog } from "@/components/create-booking-dialog"
import { BookingStats } from "@/components/booking-stats"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Bookings",
  description: "Manage truck bookings and approval workflow",
}

export const revalidate = 0

export default async function BookingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      created_by_profile:profiles!bookings_created_by_fkey(full_name),
      driver:drivers!bookings_assigned_driver_id_fkey(
        id, full_name, phone, license_number, status, photo_url, 
        address, emergency_contact_name, emergency_contact_phone, 
        emergency_contact_relationship
      ),
      vehicle:vehicles!bookings_assigned_vehicle_id_fkey(id, vehicle_number, vehicle_type, make, model, status)
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching bookings:", error)
  }

  const stats = {
    total: bookings?.length || 0,
    open: bookings?.filter((b) => ["Open", "Negotiation", "Approved"].includes(b.status)).length || 0,
    inProgress: bookings?.filter((b) => ["Assigned", "In Progress", "In Transit"].includes(b.status)).length || 0,
    closed: bookings?.filter((b) => ["Completed", "Closed"].includes(b.status)).length || 0,
  }

  const handleSignOut = async () => {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  return (
    <DashboardLayout onSignOut={handleSignOut}>
      <BookingStats {...stats} />
      
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-sm text-muted-foreground">Manage truck bookings and approval workflow</p>
        </div>
        <CreateBookingDialog />
      </div>

      <BookingsTable bookings={bookings || []} />
    </DashboardLayout>
  )
}
