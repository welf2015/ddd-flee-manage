"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createProcurement(data: {
  vendor_id: string
  vehicle_type: string
  quantity: number
  initial_quote: number
  expected_arrival_date: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Generate procurement number
  const now = new Date()
  const procurementNumber = `PROC-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${Math.floor(
    Math.random() * 10000,
  )
    .toString()
    .padStart(4, "0")}`

  const { data: procurement, error } = await supabase
    .from("procurements")
    .insert({
      procurement_number: procurementNumber,
      vendor_id: data.vendor_id,
      vehicle_type: data.vehicle_type,
      quantity: data.quantity,
      initial_quote: data.initial_quote,
      expected_arrival_date: data.expected_arrival_date,
      status: "Negotiation",
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Add timeline event
  await supabase.from("procurement_timeline").insert({
    procurement_id: procurement.id,
    action_type: "Procurement Created",
    action_by: user.id,
    notes: `New procurement for ${data.vehicle_type}`,
  })

  revalidatePath("/dashboard/procurement")
  return { success: true, data: procurement }
}

export async function updateProcurementPrice(procurementId: string, negotiatedPrice: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: procurement } = await supabase
    .from("procurements")
    .select("negotiated_price")
    .eq("id", procurementId)
    .single()

  const { error } = await supabase
    .from("procurements")
    .update({ negotiated_price: negotiatedPrice })
    .eq("id", procurementId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Add timeline event
  await supabase.from("procurement_timeline").insert({
    procurement_id: procurementId,
    action_type: "Price Updated",
    old_value: procurement?.negotiated_price?.toString(),
    new_value: negotiatedPrice.toString(),
    action_by: user.id,
  })

  revalidatePath("/dashboard/procurement")
  return { success: true }
}

export async function approveProcurement(procurementId: string, finalPrice: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  // Only MD can approve
  if (profile?.role !== "MD") {
    return { success: false, error: "Only MD can approve procurements" }
  }

  const { error } = await supabase
    .from("procurements")
    .update({
      status: "Approved",
      final_price: finalPrice,
      approved_by: user.id,
    })
    .eq("id", procurementId)

  if (error) {
    return { success: false, error: error.message }
  }

  await supabase.from("procurement_timeline").insert({
    procurement_id: procurementId,
    action_type: "Procurement Approved",
    new_value: finalPrice.toString(),
    action_by: user.id,
    notes: `Final price approved: ${finalPrice}`,
  })

  revalidatePath("/dashboard/procurement")
  return { success: true }
}

export async function updateProcurementStatus(procurementId: string, status: string, notes?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase.from("procurements").update({ status }).eq("id", procurementId)

  if (error) {
    return { success: false, error: error.message }
  }

  await supabase.from("procurement_timeline").insert({
    procurement_id: procurementId,
    action_type: `Status Changed to ${status}`,
    new_value: status,
    action_by: user.id,
    notes,
  })

  revalidatePath("/dashboard/procurement")
  return { success: true }
}

export async function assignClearingAgent(procurementId: string, clearingAgentId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("procurements")
    .update({
      clearing_agent_id: clearingAgentId,
      clearing_status: "Clearing in Progress",
    })
    .eq("id", procurementId)

  if (error) {
    return { success: false, error: error.message }
  }

  await supabase.from("procurement_timeline").insert({
    procurement_id: procurementId,
    action_type: "Clearing Agent Assigned",
    action_by: user.id,
  })

  revalidatePath("/dashboard/procurement")
  return { success: true }
}

export async function finalizeClearingAndAddVehicle(procurementId: string, vehicleData: any) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Create vehicle from procurement data
  const { data: newVehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .insert({
      vehicle_number: vehicleData.vehicle_number,
      vehicle_type: vehicleData.vehicle_type,
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year,
      status: "Active",
    })
    .select()
    .single()

  if (vehicleError) {
    return { success: false, error: vehicleError.message }
  }

  // Update procurement
  const { error: procError } = await supabase
    .from("procurements")
    .update({
      vehicle_id: newVehicle.id,
      clearing_status: "Cleared",
      status: "Completed",
      actual_arrival_date: new Date().toISOString().split("T")[0],
    })
    .eq("id", procurementId)

  if (procError) {
    return { success: false, error: procError.message }
  }

  await supabase.from("procurement_timeline").insert({
    procurement_id: procurementId,
    action_type: "Vehicle Added to Fleet",
    new_value: newVehicle.id,
    action_by: user.id,
    notes: `Vehicle ${vehicleData.vehicle_number} automatically added to vehicles`,
  })

  revalidatePath("/dashboard/procurement")
  revalidatePath("/dashboard/vehicles")
  return { success: true, data: newVehicle }
}

export async function uploadProcurementDocument(
  procurementId: string,
  fileName: string,
  fileUrl: string,
  docType: string,
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase.from("procurement_documents").insert({
    procurement_id: procurementId,
    document_name: fileName,
    document_url: fileUrl,
    document_type: docType,
    uploaded_by: user.id,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/procurement")
  return { success: true }
}
