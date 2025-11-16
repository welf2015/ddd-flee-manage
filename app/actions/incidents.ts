"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createIncident(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Handle driver ID - set to null if "none" selected
  const driverId = formData.get("driver_id") as string
  const vehicleId = formData.get("vehicle_id") as string

  const incident = {
    incident_number: `INC-${Date.now()}`,
    vehicle_id: vehicleId,
    driver_id: !driverId || driverId === "none" ? null : driverId,
    incident_date: formData.get("incident_date") as string,
    description: formData.get("description") as string,
    severity: formData.get("severity") as string,
    location: (formData.get("location") as string) || null,
    photo_url: (formData.get("photo_url") as string) || null,
    status: "Open",
  }

  const { error } = await supabase.from("incidents").insert(incident)

  if (error) {
    console.error("[v0] Error creating incident:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/incidents")
  return { success: true }
}
