"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { notifyIncidentCreated } from "@/lib/notifications"

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
  const resolvedById = formData.get("resolved_by") as string

  const towContacted = formData.get("tow_service_contacted") === "true"
  const policeContacted = formData.get("police_contacted") === "true"
  const insuranceFiled = formData.get("insurance_claim_filed") === "true"
  const downtime = formData.get("downtime") === "true"

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

    total_amount_spent: formData.get("total_amount_spent")
      ? Number.parseFloat(formData.get("total_amount_spent") as string)
      : null,
    third_parties_involved: formData.get("third_parties_involved") as string,
    witnesses: formData.get("witnesses") as string,
    immediate_action_taken: formData.get("immediate_action_taken") as string,
    insurance_claim_filed: insuranceFiled,
    insurance_reference: formData.get("insurance_reference") as string,
    repairs_authorized_by: formData.get("repairs_authorized_by") as string,
    downtime: downtime,
    workshop_name: formData.get("workshop_name") as string,
    date_returned_to_service: (formData.get("date_returned_to_service") as string) || null,
    final_comments: formData.get("final_comments") as string,
    resolved_by: !resolvedById || resolvedById === "none" ? null : resolvedById,

    tow_service_contacted: towContacted,
    police_contacted: policeContacted,
    vehicle_towed_to: formData.get("vehicle_towed_to") as string,
    report_prepared_by: user.id,
  }

  const { error } = await supabase.from("incidents").insert(incident)

  if (error) {
    console.error("[v0] Error creating incident:", error)
    return { success: false, error: error.message }
  }

  let vehicleLabel: string | null = null
  if (incident.vehicle_id) {
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("vehicle_number, make, model")
      .eq("id", incident.vehicle_id)
      .single()
    if (vehicle) {
      const meta = [vehicle.make, vehicle.model].filter(Boolean).join(" ")
      vehicleLabel = [vehicle.vehicle_number, meta].filter(Boolean).join(" - ")
    }
  }

  await notifyIncidentCreated({
    incidentNumber: incident.incident_number,
    severity: incident.severity || "Unspecified",
    vehicleLabel,
    location: incident.location || undefined,
    reportedBy: user.id,
  })

  revalidatePath("/dashboard/incidents")
  return { success: true }
}

export async function updateIncident(incidentId: string, formData: FormData) {
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
  const resolvedById = formData.get("resolved_by") as string

  const towContacted = formData.get("tow_service_contacted") === "true"
  const policeContacted = formData.get("police_contacted") === "true"
  const insuranceFiled = formData.get("insurance_claim_filed") === "true"
  const downtime = formData.get("downtime") === "true"

  const updateData = {
    vehicle_id: vehicleId,
    driver_id: !driverId || driverId === "none" ? null : driverId,
    incident_date: formData.get("incident_date") as string,
    description: formData.get("description") as string,
    severity: formData.get("severity") as string,
    location: (formData.get("location") as string) || null,
    photo_url: (formData.get("photo_url") as string) || null,
    total_amount_spent: formData.get("total_amount_spent")
      ? Number.parseFloat(formData.get("total_amount_spent") as string)
      : null,
    third_parties_involved: formData.get("third_parties_involved") as string,
    witnesses: formData.get("witnesses") as string,
    immediate_action_taken: formData.get("immediate_action_taken") as string,
    insurance_claim_filed: insuranceFiled,
    insurance_reference: formData.get("insurance_reference") as string,
    repairs_authorized_by: formData.get("repairs_authorized_by") as string,
    downtime: downtime,
    workshop_name: formData.get("workshop_name") as string,
    date_returned_to_service: (formData.get("date_returned_to_service") as string) || null,
    final_comments: formData.get("final_comments") as string,
    resolved_by: !resolvedById || resolvedById === "none" ? null : resolvedById,
    tow_service_contacted: towContacted,
    police_contacted: policeContacted,
    vehicle_towed_to: formData.get("vehicle_towed_to") as string,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from("incidents").update(updateData).eq("id", incidentId)

  if (error) {
    console.error("[v0] Error updating incident:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/incidents")
  revalidatePath("/dashboard/vehicle-management/incidents")
  return { success: true }
}

export async function deleteIncident(incidentId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get incident data for logging
  const { data: incident } = await supabase.from("incidents").select("*").eq("id", incidentId).single()

  if (!incident) {
    return { success: false, error: "Incident not found" }
  }

  // Delete the incident
  const { error } = await supabase.from("incidents").delete().eq("id", incidentId)

  if (error) {
    return { success: false, error: `Delete failed: ${error.message}` }
  }

  // Get user profile for logging
  const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).single()

  // Log the action
  await supabase.from("system_activity_log").insert({
    module: "Incidents",
    action: "Deleted",
    reference_id: incident.incident_number,
    description: `Deleted incident: ${incident.incident_number}`,
    user_id: user.id,
    user_name: profile?.full_name || "Unknown",
    user_email: profile?.email || "",
    old_value: JSON.stringify(incident),
  })

  revalidatePath("/dashboard/incidents")
  revalidatePath("/dashboard/vehicle-management/incidents")
  return { success: true }
}
