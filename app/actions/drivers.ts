"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createDriver(formData: FormData) {
  console.log("[v0] createDriver action called")

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] User:", user?.id)

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const assignedVehicleId = formData.get("assigned_vehicle_id") as string
  const vehicleId = !assignedVehicleId || assignedVehicleId === "none" ? null : assignedVehicleId

  const driver = {
    full_name: formData.get("full_name") as string,
    phone: formData.get("phone") as string,
    address: (formData.get("address") as string) || null,
    license_number: formData.get("license_number") as string,
    license_expiry: (formData.get("license_expiry") as string) || null,
    photo_url: (formData.get("photo_url") as string) || null,
    emergency_contact_name: (formData.get("emergency_contact_name") as string) || null,
    emergency_contact_phone: (formData.get("emergency_contact_phone") as string) || null,
    emergency_contact_relationship: (formData.get("emergency_contact_relationship") as string) || null,
    assigned_vehicle_id: vehicleId,
    status: "Active",
  }

  console.log("[v0] Driver data:", driver)

  const { data, error } = await supabase.from("drivers").insert(driver).select()

  if (error) {
    console.error("[v0] Error creating driver:", error)
    return { success: false, error: error.message }
  }

  console.log("[v0] Driver created successfully:", data)
  revalidatePath("/dashboard/drivers")
  return { success: true }
}

export async function rateDriver(
  driverId: string,
  bookingId: string,
  data: {
    rating: number
    feedback: string
    clientFeedback: string
  },
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase.from("driver_ratings").insert({
    driver_id: driverId,
    booking_id: bookingId,
    rating: data.rating,
    feedback: data.feedback,
    client_feedback: data.clientFeedback,
    rated_by: user.id,
  })

  if (error) {
    console.error("Error rating driver:", error)
    return { success: false, error: error.message }
  }

  await supabase.from("bookings").update({ status: "Closed" }).eq("id", bookingId)

  revalidatePath("/dashboard/bookings")
  revalidatePath("/dashboard/drivers")
  return { success: true }
}
