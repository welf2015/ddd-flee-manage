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

  revalidatePath("/dashboard/incidents")
  return { success: true }
}
