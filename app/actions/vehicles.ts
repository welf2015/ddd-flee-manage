"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createVehicle(formData: FormData) {
  console.log("[v0] createVehicle action called")

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] User:", user?.id)

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const vehicle = {
    vehicle_number: formData.get("vehicle_number") as string,
    vehicle_type: formData.get("vehicle_type") as string,
    make: formData.get("make") as string,
    model: formData.get("model") as string,
    year: Number.parseInt(formData.get("year") as string),
    status: formData.get("status") as string,
  }

  console.log("[v0] Vehicle data:", vehicle)

  const { data, error } = await supabase.from("vehicles").insert(vehicle).select()

  if (error) {
    console.error("[v0] Error creating vehicle:", error)
    return { success: false, error: error.message }
  }

  console.log("[v0] Vehicle created successfully:", data)
  revalidatePath("/dashboard/vehicles")
  return { success: true }
}

export async function updateVehicleStatus(vehicleId: string, status: string) {
  console.log("[v0] updateVehicleStatus called:", { vehicleId, status })

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase.from("vehicles").update({ status }).eq("id", vehicleId)

  if (error) {
    console.error("[v0] Error updating vehicle status:", error)
    return { success: false, error: error.message }
  }

  console.log("[v0] Vehicle status updated successfully")
  revalidatePath("/dashboard/vehicles")
  return { success: true }
}
