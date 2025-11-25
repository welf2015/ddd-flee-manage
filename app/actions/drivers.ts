"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
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

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("full_name") as string

  let authUserId = null

  // Only create auth user if email and password are provided
  if (email && password) {
    // Create Auth User using Admin Client
    const adminClient = createAdminClient()
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "driver",
      },
    })

    if (authError) {
      console.error("[v0] Error creating auth user:", authError)
      return { success: false, error: `Auth Error: ${authError.message}` }
    }

    authUserId = authData.user.id
  }

  const assignedVehicleId = formData.get("assigned_vehicle_id") as string
  const vehicleId = !assignedVehicleId || assignedVehicleId === "none" ? null : assignedVehicleId

  const driver = {
    full_name: fullName,
    email: email || null,
    user_id: authUserId, // Will be null if no auth account created
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
    // Try to clean up the auth user if DB insert fails and auth user was created
    if (authUserId) {
      const adminClient = createAdminClient()
      await adminClient.auth.admin.deleteUser(authUserId)
    }
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

export async function updateDriverVehicle(driverId: string, vehicleId: string | null) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase.from("drivers").update({ assigned_vehicle_id: vehicleId }).eq("id", driverId)

  if (error) {
    console.error("Error updating driver vehicle:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/drivers")
  return { success: true }
}
