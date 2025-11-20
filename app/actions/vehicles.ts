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

export async function createVehicleWithOnboarding(data: {
  vehicle_number: string
  vehicle_type: string
  make: string
  model: string
  year: number
  status: string
  createOnboarding: boolean
}) {
  console.log("[v0] createVehicleWithOnboarding action called")

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const vehicle = {
    vehicle_number: data.vehicle_number,
    vehicle_type: data.vehicle_type,
    make: data.make,
    model: data.model,
    year: data.year,
    status: data.status,
  }

  const { data: vehicleData, error: vehicleError } = await supabase.from("vehicles").insert(vehicle).select().single()

  if (vehicleError) {
    console.error("[v0] Error creating vehicle:", vehicleError)
    return { success: false, error: vehicleError.message }
  }

  // If createOnboarding is true, create onboarding record
  if (data.createOnboarding) {
    const { data: onboarding, error: onboardingError } = await supabase
      .from("vehicle_onboarding")
      .insert({
        vehicle_number: data.vehicle_number,
        vehicle_type: data.vehicle_type,
        make: data.make,
        model: data.model,
        year: data.year,
        status: "In Progress",
        assigned_to: user.id,
      })
      .select()
      .single()

    if (onboardingError) {
      console.error("[v0] Error creating onboarding:", onboardingError)
      return { success: false, error: onboardingError.message }
    }

    // Get all checklist items
    const { data: checklistItems } = await supabase.from("onboarding_checklist_items").select("id").order("order_index")

    // Create progress entries for all checklist items
    if (checklistItems && checklistItems.length > 0) {
      const progressEntries = checklistItems.map((item) => ({
        onboarding_id: onboarding.id,
        checklist_item_id: item.id,
        is_completed: false,
      }))

      await supabase.from("vehicle_onboarding_progress").insert(progressEntries)
    }
  }

  console.log("[v0] Vehicle created successfully:", vehicleData)
  revalidatePath("/dashboard/vehicle-management")
  revalidatePath("/dashboard/vehicle-management/onboarding")
  return { success: true, data: vehicleData }
}

export async function markVehicleAsOnboarded(vehicleId: string) {
  console.log("[v0] markVehicleAsOnboarded called:", { vehicleId })

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get vehicle details
  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", vehicleId)
    .single()

  if (vehicleError || !vehicle) {
    return { success: false, error: "Vehicle not found" }
  }

  // Check if onboarding already exists
  const { data: existingOnboarding } = await supabase
    .from("vehicle_onboarding")
    .select("id")
    .eq("vehicle_number", vehicle.vehicle_number)
    .single()

  if (existingOnboarding) {
    return { success: false, error: "Onboarding record already exists for this vehicle" }
  }

  // Create completed onboarding record
  const { data: onboarding, error: onboardingError } = await supabase
    .from("vehicle_onboarding")
    .insert({
      vehicle_number: vehicle.vehicle_number,
      vehicle_type: vehicle.vehicle_type,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      status: "Completed",
      assigned_to: user.id,
      completed_at: new Date().toISOString(),
      notes: "Marked as already onboarded",
    })
    .select()
    .single()

  if (onboardingError) {
    console.error("[v0] Error creating onboarding:", onboardingError)
    return { success: false, error: onboardingError.message }
  }

  // Get all checklist items and mark them as completed
  const { data: checklistItems } = await supabase.from("onboarding_checklist_items").select("id").order("order_index")

  if (checklistItems && checklistItems.length > 0) {
    const progressEntries = checklistItems.map((item) => ({
      onboarding_id: onboarding.id,
      checklist_item_id: item.id,
      is_completed: true,
      completed_at: new Date().toISOString(),
      completed_by: user.id,
      notes: "Marked as already onboarded",
    }))

    await supabase.from("vehicle_onboarding_progress").insert(progressEntries)
  }

  console.log("[v0] Vehicle marked as onboarded successfully")
  revalidatePath("/dashboard/vehicle-management")
  revalidatePath("/dashboard/vehicle-management/onboarding")
  return { success: true, data: onboarding }
}
