"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getOnboardingDetails(onboardingId: string) {
  const supabase = await createClient()

  // 1. Try to fetch the onboarding record with current progress
  const { data: onboarding, error } = await supabase
    .from("vehicle_onboarding")
    .select(`
      *,
      procurement:procurements!vehicle_onboarding_procurement_id_fkey(
        procurement_number, 
        received_by,
        received_at,
        vendor:vendors(name, email, phone),
        clearing_agent:clearing_agents(name, email, phone)
      ),
      assigned_to:profiles(full_name),
      progress:vehicle_onboarding_progress(
        *,
        checklist_item:onboarding_checklist_items(
          *,
          category:onboarding_categories(name)
        ),
        completed_by:profiles(full_name)
      )
    `)
    .eq("id", onboardingId)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // 2. If progress is empty, it means we need to initialize it with the new checklist
  if (!onboarding.progress || onboarding.progress.length === 0) {
    // Get all checklist items
    const { data: checklistItems } = await supabase.from("onboarding_checklist_items").select("id").order("order_index")

    if (checklistItems && checklistItems.length > 0) {
      const progressEntries = checklistItems.map((item) => ({
        onboarding_id: onboardingId,
        checklist_item_id: item.id,
        is_completed: false,
      }))

      const { error: insertError } = await supabase.from("vehicle_onboarding_progress").insert(progressEntries)

      if (insertError) {
        console.error("Error initializing progress:", insertError)
        return { success: false, error: "Failed to initialize checklist" }
      }

      // 3. Refetch the data now that progress exists
      const { data: refetchedData, error: refetchError } = await supabase
        .from("vehicle_onboarding")
        .select(`
          *,
          procurement:procurements!vehicle_onboarding_procurement_id_fkey(
            procurement_number, 
            received_by,
            received_at,
            vendor:vendors(name, email, phone),
            clearing_agent:clearing_agents(name, email, phone)
          ),
          assigned_to:profiles(full_name),
          progress:vehicle_onboarding_progress(
            *,
            checklist_item:onboarding_checklist_items(
              *,
              category:onboarding_categories(name)
            ),
            completed_by:profiles(full_name)
          )
        `)
        .eq("id", onboardingId)
        .single()

      if (refetchError) {
        return { success: false, error: refetchError.message }
      }

      return { success: true, data: refetchedData }
    }
  }

  return { success: true, data: onboarding }
}

export async function toggleChecklistItem(progressId: string, isCompleted: boolean) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const updateData: any = {
    is_completed: isCompleted,
    updated_at: new Date().toISOString(),
  }

  if (isCompleted) {
    updateData.completed_at = new Date().toISOString()
    updateData.completed_by = user.id
  } else {
    updateData.completed_at = null
    updateData.completed_by = null
  }

  const { error } = await supabase.from("vehicle_onboarding_progress").update(updateData).eq("id", progressId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/vehicle-management/onboarding")
  return { success: true }
}

export async function completeOnboarding(onboardingId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get onboarding details with full checklist item and category data
  const { data: onboarding } = await supabase
    .from("vehicle_onboarding")
    .select(`
      *,
      progress:vehicle_onboarding_progress(
        *,
        checklist_item:onboarding_checklist_items(
          id,
          category:onboarding_categories(name)
        )
      )
    `)
    .eq("id", onboardingId)
    .single()

  if (!onboarding) {
    return { success: false, error: "Onboarding not found" }
  }

  // For Trucks and Bikes, exclude Accessories category from completion check
  const shouldExcludeAccessories = onboarding.vehicle_type === "Truck" || onboarding.vehicle_type === "Bike"
  const relevantProgress = shouldExcludeAccessories
    ? onboarding.progress.filter((p: any) => p.checklist_item?.category?.name !== "Accessories")
    : onboarding.progress

  // Check if all required items are completed
  const allCompleted = relevantProgress.every((p: any) => p.is_completed)
  if (!allCompleted) {
    return { success: false, error: "Not all checklist items are completed" }
  }

  // Create vehicle from onboarding data
  const { data: newVehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .insert({
      vehicle_number: onboarding.vehicle_number,
      vehicle_type: onboarding.vehicle_type,
      make: onboarding.make,
      model: onboarding.model,
      year: onboarding.year,
      status: "Active",
    })
    .select()
    .single()

  if (vehicleError) {
    return { success: false, error: vehicleError.message }
  }

  // Update onboarding status
  const { error: onboardingError } = await supabase
    .from("vehicle_onboarding")
    .update({
      status: "Completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", onboardingId)

  if (onboardingError) {
    return { success: false, error: onboardingError.message }
  }

  // Update procurement if linked
  if (onboarding.procurement_id) {
    await supabase
      .from("procurements")
      .update({
        vehicle_id: newVehicle.id,
        onboarding_id: onboardingId,
        status: "Completed",
      })
      .eq("id", onboarding.procurement_id)

    await supabase.from("procurement_timeline").insert({
      procurement_id: onboarding.procurement_id,
      action_type: "Onboarding Completed",
      new_value: newVehicle.id,
      action_by: user.id,
      notes: `Vehicle ${onboarding.vehicle_number} completed onboarding and added to fleet`,
    })
  }

  revalidatePath("/dashboard/vehicle-management/onboarding")
  revalidatePath("/dashboard/vehicles")
  return { success: true, data: newVehicle }
}

export async function createOnboardingFromProcurement(procurementId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get procurement details
  const { data: procurement } = await supabase.from("procurements").select("*").eq("id", procurementId).single()

  if (!procurement) {
    return { success: false, error: "Procurement not found" }
  }

  // Create onboarding
  const { data: onboarding, error: onboardingError } = await supabase
    .from("vehicle_onboarding")
    .insert({
      procurement_id: procurementId,
      vehicle_type: procurement.vehicle_type,
      assigned_to: user.id,
      status: "In Progress",
    })
    .select()
    .single()

  if (onboardingError) {
    return { success: false, error: onboardingError.message }
  }

  // Get all checklist items
  const { data: checklistItems } = await supabase.from("onboarding_checklist_items").select("id").order("order_index")

  // Create progress entries for all checklist items
  if (checklistItems) {
    const progressEntries = checklistItems.map((item) => ({
      onboarding_id: onboarding.id,
      checklist_item_id: item.id,
      is_completed: false,
    }))

    await supabase.from("vehicle_onboarding_progress").insert(progressEntries)
  }

  // Update procurement
  await supabase
    .from("procurements")
    .update({
      onboarding_id: onboarding.id,
      status: "Onboarding",
    })
    .eq("id", procurementId)

  revalidatePath("/dashboard/procurement")
  revalidatePath("/dashboard/vehicle-management/onboarding")
  return { success: true, data: onboarding }
}

export async function createManualOnboarding(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const vehicle_number = formData.get("vehicle_number") as string
  const vehicle_type = formData.get("vehicle_type") as string
  const make = formData.get("make") as string
  const model = formData.get("model") as string
  const year = Number.parseInt(formData.get("year") as string)
  const notes = formData.get("notes") as string

  if (!vehicle_number || !vehicle_type || !make || !model || !year) {
    return { success: false, error: "Missing required fields" }
  }

  // Create onboarding record
  const { data: onboarding, error: onboardingError } = await supabase
    .from("vehicle_onboarding")
    .insert({
      vehicle_number,
      vehicle_type,
      make,
      model,
      year,
      notes,
      assigned_to: user.id,
      status: "In Progress",
    })
    .select()
    .single()

  if (onboardingError) {
    return { success: false, error: onboardingError.message }
  }

  // Get all checklist items
  const { data: checklistItems } = await supabase.from("onboarding_checklist_items").select("id").order("order_index")

  // Create progress entries for all checklist items
  if (checklistItems) {
    const progressEntries = checklistItems.map((item) => ({
      onboarding_id: onboarding.id,
      checklist_item_id: item.id,
      is_completed: false,
    }))

    await supabase.from("vehicle_onboarding_progress").insert(progressEntries)
  }

  revalidatePath("/dashboard/vehicle-management/onboarding")
  return { success: true, data: onboarding }
}

export async function updateOnboarding(onboardingId: string, data: any) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get current onboarding data for logging
  const { data: currentData } = await supabase.from("vehicle_onboarding").select("*").eq("id", onboardingId).single()

  // Update onboarding
  const updatePayload: any = {
    vehicle_number: data.vehicle_number,
    vehicle_type: data.vehicle_type,
    make: data.make,
    model: data.model,
    year: data.year,
    registration_date: data.registration_date,
    registration_expiry_date: data.registration_expiry_date,
    insurance_expiry_date: data.insurance_expiry_date,
    road_worthiness_expiry_date: data.road_worthiness_expiry_date,
    hackney_permit_expiry_date: data.hackney_permit_na ? null : data.hackney_permit_expiry_date,
    vehicle_license_expiry_date: data.vehicle_license_expiry_date,
    ownership_transfer_date: data.ownership_transfer_na ? null : data.ownership_transfer_date,
    hackney_permit_na: data.hackney_permit_na,
    ownership_transfer_na: data.ownership_transfer_na,
    notes: data.notes,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from("vehicle_onboarding").update(updatePayload).eq("id", onboardingId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Get user profile for logging
  const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).single()

  // Log the action to system_activity_log
  const changes = []
  if (currentData.vehicle_number !== data.vehicle_number) changes.push("Vehicle Number")
  if (currentData.vehicle_type !== data.vehicle_type) changes.push("Vehicle Type")
  if (currentData.make !== data.make) changes.push("Make")
  if (currentData.model !== data.model) changes.push("Model")
  if (data.registration_date) changes.push("Registration Date")
  if (data.registration_expiry_date) changes.push("Registration Expiry")
  if (data.insurance_expiry_date) changes.push("Insurance Expiry")
  if (data.road_worthiness_expiry_date) changes.push("Road Worthiness Expiry")
  if (data.hackney_permit_expiry_date || data.hackney_permit_na) changes.push("Hackney Permit")
  if (data.vehicle_license_expiry_date) changes.push("Vehicle License Expiry")
  if (data.ownership_transfer_date || data.ownership_transfer_na) changes.push("Ownership Transfer")

  await supabase.from("system_activity_log").insert({
    module: "Vehicle Onboarding",
    action: "Updated",
    reference_id: data.vehicle_number || onboardingId,
    description: `Updated onboarding: ${changes.join(", ")}`,
    user_id: user.id,
    user_name: profile?.full_name || "Unknown",
    user_email: profile?.email || "",
    old_value: JSON.stringify(currentData),
    new_value: JSON.stringify(updatePayload),
  })

  revalidatePath("/dashboard/vehicle-management/onboarding")
  return { success: true }
}
