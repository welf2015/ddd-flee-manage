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

export async function moveProcurementToOnboarding(procurementId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get procurement details
  const { data: procurement } = await supabase
    .from("procurements")
    .select("*")
    .eq("id", procurementId)
    .single()

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
  const { data: checklistItems } = await supabase
    .from("onboarding_checklist_items")
    .select("id")
    .order("order_index")

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

  await supabase.from("procurement_timeline").insert({
    procurement_id: procurementId,
    action_type: "Moved to Onboarding",
    action_by: user.id,
    notes: "Vehicle moved to onboarding process",
  })

  revalidatePath("/dashboard/procurement")
  revalidatePath("/dashboard/vehicle-management/onboarding")
  return { success: true, data: onboarding }
}

export async function closeDealWithVendor(procurementId: string, finalPrice: number) {
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
      status: "Vendor Accepted",
      final_price: finalPrice,
      deal_closed_date: new Date().toISOString(),
      payment_status: "Pending",
    })
    .eq("id", procurementId)

  if (error) {
    return { success: false, error: error.message }
  }

  await supabase.from("procurement_timeline").insert({
    procurement_id: procurementId,
    action_type: "Deal Closed with Vendor",
    new_value: finalPrice.toString(),
    action_by: user.id,
    notes: `Vendor accepted deal at ₦${finalPrice.toLocaleString()}`,
  })

  // Create notification for MD/ED
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .in("role", ["MD", "ED"])

  if (admins) {
    const notifications = admins.map((admin) => ({
      user_id: admin.id,
      type: "procurement",
      title: "Procurement Deal Closed",
      message: `Deal closed for procurement at ₦${finalPrice.toLocaleString()}. Payment pending.`,
      related_id: procurementId,
    }))
    await supabase.from("notifications").insert(notifications)
  }

  revalidatePath("/dashboard/procurement")
  return { success: true }
}

export async function markProcurementAsPaid(procurementId: string, invoiceUrl?: string) {
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
      payment_status: "Paid",
      status: "Paid",
    })
    .eq("id", procurementId)

  if (error) {
    return { success: false, error: error.message }
  }

  await supabase.from("procurement_timeline").insert({
    procurement_id: procurementId,
    action_type: "Payment Completed",
    action_by: user.id,
    notes: "Payment has been made to vendor",
  })

  // Optionally upload invoice
  if (invoiceUrl) {
    await supabase.from("procurement_documents").insert({
      procurement_id: procurementId,
      document_name: "Payment Invoice",
      document_url: invoiceUrl,
      document_type: "Invoice",
      uploaded_by: user.id,
    })
  }

  revalidatePath("/dashboard/procurement")
  return { success: true }
}

export async function updateShippingInfo(
  procurementId: string,
  data: {
    waybill_number: string
    tracking_info: string
    estimated_delivery_months: number
    shipping_date: string
  },
) {
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
      ...data,
      status: "In Transit",
    })
    .eq("id", procurementId)

  if (error) {
    return { success: false, error: error.message }
  }

  await supabase.from("procurement_timeline").insert({
    procurement_id: procurementId,
    action_type: "Shipping Details Updated",
    action_by: user.id,
    notes: `Waybill: ${data.waybill_number}, ETA: ${data.estimated_delivery_months} months`,
  })

  revalidatePath("/dashboard/procurement")
  return { success: true }
}

export async function markVehicleAsArrived(procurementId: string) {
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
      status: "Arrived",
      actual_arrival_date: new Date().toISOString().split("T")[0],
    })
    .eq("id", procurementId)

  if (error) {
    return { success: false, error: error.message }
  }

  await supabase.from("procurement_timeline").insert({
    procurement_id: procurementId,
    action_type: "Vehicle Arrived",
    action_by: user.id,
    notes: "Vehicle has arrived and ready for clearing",
  })

  // Notify relevant staff
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .in("role", ["MD", "ED", "Head of Operations"])

  if (admins) {
    const notifications = admins.map((admin) => ({
      user_id: admin.id,
      type: "procurement",
      title: "Vehicle Arrived",
      message: "Procured vehicle has arrived. Please assign clearing agent.",
      related_id: procurementId,
    }))
    await supabase.from("notifications").insert(notifications)
  }

  revalidatePath("/dashboard/procurement")
  return { success: true }
}

export const negotiateProcurement = updateProcurementPrice
export const closeProcurementDeal = closeDealWithVendor
export const addShippingInfo = updateShippingInfo
export const markAsArrived = markVehicleAsArrived
export const moveToOnboarding = moveProcurementToOnboarding
