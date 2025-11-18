"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { notifyAdminsForBookingApproval, notifyStatusChange } from "@/lib/notifications"

export async function createBooking(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: jobIdData, error: jobIdError } = await supabase.rpc("generate_job_id")

  if (jobIdError) {
    return { success: false, error: `Failed to generate job ID: ${jobIdError.message}` }
  }

  if (!jobIdData) {
    return { success: false, error: "Failed to generate job ID: No data returned" }
  }

  const clientName = formData.get("client_name") as string
  const clientContact = formData.get("client_contact") as string
  const clientEmail = formData.get("client_email") as string
  const route = formData.get("route") as string
  const proposedBudget = Number.parseFloat(formData.get("proposed_client_budget") as string)

  let clientId: string | null = null

  // Check if client already exists
  const { data: existingClient } = await supabase.from("clients").select("id").eq("phone", clientContact).single()

  if (existingClient) {
    clientId = existingClient.id
    // Update existing client with new info if provided
    await supabase
      .from("clients")
      .update({
        name: clientName,
        email: clientEmail,
        contact_name: clientName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId)
  } else {
    // Create new client
    const { data: newClient } = await supabase
      .from("clients")
      .insert({
        name: clientName,
        phone: clientContact,
        email: clientEmail,
        contact_name: clientName,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (newClient) {
      clientId = newClient.id
    }
  }

  const booking = {
    job_id: jobIdData,
    client_name: clientName,
    client_contact: clientContact,
    client_id: clientId,
    route,
    number_of_loads: Number.parseInt(formData.get("number_of_loads") as string),
    proposed_client_budget: proposedBudget,
    timeline: formData.get("timeline") as string,
    request_details: formData.get("request_details") as string,
    status: "Open",
    created_by: user.id,
    requires_waybill: formData.get("requires_waybill") === "true",
  }

  const { data: insertedData, error } = await supabase.from("bookings").insert(booking).select()

  if (error) {
    return { success: false, error: error.message }
  }

  if (insertedData?.[0]) {
    await supabase.from("job_timeline").insert({
      booking_id: insertedData[0].id,
      action_type: "Created",
      action_by: user.id,
      notes: `New booking created for ${clientName}`,
    })

    await notifyAdminsForBookingApproval({
      jobId: jobIdData,
      clientName,
      route,
      budget: proposedBudget,
      createdBy: user.id,
      bookingId: insertedData[0].id,
    })
  }

  revalidatePath("/dashboard/bookings")
  revalidatePath("/dashboard/clients")
  return { success: true, data: insertedData?.[0] }
}

export async function assignDriverToBooking(bookingId: string, driverId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get driver's assigned vehicle
  const { data: driver, error: driverError } = await supabase
    .from("drivers")
    .select("assigned_vehicle_id")
    .eq("id", driverId)
    .single()

  if (driverError || !driver) {
    return { success: false, error: "Driver not found" }
  }

  // Update booking with driver and vehicle, set status to Assigned
  const { error } = await supabase
    .from("bookings")
    .update({
      assigned_driver_id: driverId,
      assigned_vehicle_id: driver.assigned_vehicle_id,
      status: "Assigned",
    })
    .eq("id", bookingId)

  if (error) {
    console.error("Error assigning driver:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/bookings")
  return { success: true }
}

export async function updateBookingStatus(bookingId: string, status: string) {
  console.log("[v0] updateBookingStatus called:", { bookingId, status })
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] User authenticated:", user?.id)

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("status, job_id, client_name")
    .eq("id", bookingId)
    .single()

  if (!booking) {
    return { success: false, error: "Booking not found" }
  }

  const updateData: any = { status }

  // Set timestamps based on status
  if (status === "In Progress") {
    updateData.started_at = new Date().toISOString()
  } else if (status === "Completed") {
    updateData.completed_at = new Date().toISOString()
  }

  console.log("[v0] Updating booking with data:", updateData)

  const { error } = await supabase.from("bookings").update(updateData).eq("id", bookingId)

  if (error) {
    console.error("[v0] Error updating status:", error)
    return { success: false, error: error.message }
  }

  const notifyRoles = ["MD", "ED", "Head of Operations"]
  await notifyStatusChange({
    jobId: booking.job_id,
    clientName: booking.client_name,
    oldStatus: booking.status,
    newStatus: status,
    changedBy: user.id,
    notifyRoles,
    bookingId: bookingId,
  })

  console.log("[v0] Status update successful")
  revalidatePath("/dashboard/bookings")
  revalidatePath("/dashboard/drivers")
  return { success: true }
}

export async function closeBooking(
  bookingId: string,
  data: {
    waybillUrl: string | null
    incidentReport: string | null
    additionalCosts: string
    actualCost: number | null
  },
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Update booking to Completed status
  const { error: bookingError } = await supabase
    .from("bookings")
    .update({
      status: "Completed",
      completed_at: new Date().toISOString(),
      actual_cost: data.actualCost,
      additional_costs: data.additionalCosts,
    })
    .eq("id", bookingId)

  if (bookingError) {
    console.error("Error closing booking:", bookingError)
    return { success: false, error: bookingError.message }
  }

  // Upload waybill if provided
  if (data.waybillUrl) {
    await supabase.from("waybill_uploads").insert({
      booking_id: bookingId,
      file_url: data.waybillUrl,
      uploaded_by: user.id,
    })

    // Add to timeline
    await supabase.from("job_timeline").insert({
      booking_id: bookingId,
      action_type: "Waybill Uploaded",
      action_by: user.id,
      notes: "Waybill document uploaded",
    })
  }

  // Create incident if reported
  if (data.incidentReport) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("assigned_vehicle_id, assigned_driver_id")
      .eq("id", bookingId)
      .single()

    if (booking) {
      await supabase.from("incidents").insert({
        incident_number: `INC-${Date.now()}`,
        vehicle_id: booking.assigned_vehicle_id,
        driver_id: booking.assigned_driver_id,
        incident_date: new Date().toISOString(),
        description: data.incidentReport,
        severity: "Medium",
        status: "Open",
      })
    }
  }

  revalidatePath("/dashboard/bookings")
  revalidatePath("/dashboard/drivers")
  return { success: true }
}

export async function uploadWaybill(bookingId: string, fileUrl: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase.from("waybill_uploads").insert({
    booking_id: bookingId,
    file_url: fileUrl,
    uploaded_by: user.id,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // Add to timeline
  await supabase.from("job_timeline").insert({
    booking_id: bookingId,
    action_type: "Waybill Uploaded",
    action_by: user.id,
    notes: "Waybill document uploaded",
  })

  revalidatePath("/dashboard/bookings")
  return { success: true }
}

export async function addTimelineEvent(
  bookingId: string,
  actionType: string,
  oldValue?: string,
  newValue?: string,
  notes?: string,
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase.from("job_timeline").insert({
    booking_id: bookingId,
    action_type: actionType,
    old_value: oldValue,
    new_value: newValue,
    action_by: user.id,
    notes,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function reportTripHold(bookingId: string, holdReason: string, notes: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error: statusError } = await supabase
    .from("bookings")
    .update({ status: "On Hold" })
    .eq("id", bookingId)

  if (statusError) {
    return { success: false, error: statusError.message }
  }

  const { error } = await supabase.from("job_timeline").insert({
    booking_id: bookingId,
    action_type: "Status Updated",
    action_by: user.id,
    notes: `Trip on hold - ${holdReason}: ${notes}`,
    hold_reason: holdReason,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/bookings")
  return { success: true }
}

export async function logTripExpenses(bookingId: string, expenses: any[]) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const expensesData = expenses.map((expense) => ({
    booking_id: bookingId,
    cost_type: expense.cost_type,
    amount: parseFloat(expense.amount),
    description: expense.description,
    receipt_url: expense.receipt_url || null,
    created_by: user.id,
  }))

  const { error } = await supabase.from("job_costs").insert(expensesData)

  if (error) {
    return { success: false, error: error.message }
  }

  // Add timeline event
  const totalAmount = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
  await supabase.from("job_timeline").insert({
    booking_id: bookingId,
    action_type: "Status Updated",
    action_by: user.id,
    notes: `Trip expenses logged: ${expenses.length} items totaling ₦${totalAmount.toLocaleString()}`,
  })

  revalidatePath("/dashboard/bookings")
  return { success: true }
}
