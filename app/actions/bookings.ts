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

  const companyName = formData.get("company_name") as string
  const clientName = formData.get("client_name") as string
  const clientContact = formData.get("client_contact") as string
  const clientEmail = formData.get("client_email") as string
  const clientAddress = formData.get("client_address") as string
  const destinationContactName = formData.get("destination_contact_name") as string
  const destinationContactPhone = formData.get("destination_contact_phone") as string
  const route = formData.get("route") as string
  const proposedBudget = Number.parseFloat(formData.get("proposed_client_budget") as string)

  const pickupLat = formData.get("pickup_lat") ? Number.parseFloat(formData.get("pickup_lat") as string) : null
  const pickupLng = formData.get("pickup_lng") ? Number.parseFloat(formData.get("pickup_lng") as string) : null
  const deliveryLat = formData.get("delivery_lat") ? Number.parseFloat(formData.get("delivery_lat") as string) : null
  const deliveryLng = formData.get("delivery_lng") ? Number.parseFloat(formData.get("delivery_lng") as string) : null
  const pickupAddress = formData.get("pickup_address") as string
  const deliveryAddress = formData.get("delivery_address") as string

  let clientId: string | null = null

  const { data: existingClient } = await supabase
    .from("clients")
    .select("id")
    .or(`phone.eq.${clientContact}${companyName ? `,company_name.eq.${companyName}` : ""}`)
    .single()

  if (existingClient) {
    clientId = existingClient.id
    await supabase
      .from("clients")
      .update({
        name: clientName,
        company_name: companyName || clientName, // Use client name if no company
        email: clientEmail,
        address: clientAddress,
        contact_name: clientName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId)
  } else {
    const { data: newClient } = await supabase
      .from("clients")
      .insert({
        name: clientName,
        company_name: companyName || clientName, // Use client name if no company
        phone: clientContact,
        email: clientEmail,
        address: clientAddress,
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
    company_name: companyName || clientName, // Use client name if no company
    client_address: clientAddress, // Add address
    client_contact: clientContact,
    client_id: clientId,
    destination_contact_name: destinationContactName, // Add destination contact
    destination_contact_phone: destinationContactPhone, // Add destination phone
    route,
    pickup_address: pickupAddress, // Store pickup address
    delivery_address: deliveryAddress, // Store delivery address
    pickup_lat: pickupLat, // Store coordinates for map display
    pickup_lng: pickupLng,
    delivery_lat: deliveryLat,
    delivery_lng: deliveryLng,
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
      notes: `New booking created for ${companyName || clientName}`,
    })

    await notifyAdminsForBookingApproval({
      jobId: jobIdData,
      clientName: companyName || clientName,
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

  // Update booking to Completed status with Unpaid payment status
  const { error: bookingError } = await supabase
    .from("bookings")
    .update({
      status: "Completed",
      payment_status: "Unpaid",
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

export async function markBookingAsPaid(bookingId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("bookings")
    .update({
      payment_status: "Paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Add timeline event
  await supabase.from("job_timeline").insert({
    booking_id: bookingId,
    action_type: "Payment Marked as Paid",
    action_by: user.id,
    notes: "Payment has been received for this booking",
  })

  revalidatePath("/dashboard/bookings")
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

  const { error: statusError } = await supabase.from("bookings").update({ status: "On Hold" }).eq("id", bookingId)

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
    amount: Number.parseFloat(expense.amount),
    description: expense.description,
    receipt_url: expense.receipt_url || null,
    created_by: user.id,
  }))

  const { error } = await supabase.from("job_costs").insert(expensesData)

  if (error) {
    return { success: false, error: error.message }
  }

  // Add timeline event
  const totalAmount = expenses.reduce((sum, e) => sum + Number.parseFloat(e.amount), 0)
  await supabase.from("job_timeline").insert({
    booking_id: bookingId,
    action_type: "Status Updated",
    notes: `Trip expenses logged: ${expenses.length} items totaling ₦${totalAmount.toLocaleString()}`,
    action_by: user.id,
  })

  revalidatePath("/dashboard/bookings")
  return { success: true }
}

export async function saveDriverFeedback(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const bookingId = formData.get("booking_id") as string
  const driverRating = Number.parseInt(formData.get("driver_rating") as string)
  const punctualityRating = Number.parseInt(formData.get("punctuality_rating") as string)
  const vehicleConditionRating = Number.parseInt(formData.get("vehicle_condition_rating") as string)
  const communicationRating = Number.parseInt(formData.get("communication_rating") as string)
  const feedback = formData.get("feedback") as string

  // Update booking with ratings
  const { error } = await supabase
    .from("bookings")
    .update({
      driver_rating: driverRating,
      punctuality_rating: punctualityRating,
      vehicle_condition_rating: vehicleConditionRating,
      communication_rating: communicationRating,
      driver_feedback: feedback,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)

  if (error) {
    console.error("[v0] Failed to save feedback:", error)
    return { success: false, error: error.message }
  }

  // Add to timeline
  await supabase.from("job_timeline").insert({
    booking_id: bookingId,
    action_type: "Status Updated",
    notes: `Driver feedback submitted with ${driverRating}/5 rating`,
    action_by: user.id,
  })

  revalidatePath("/dashboard/bookings")
  revalidatePath("/dashboard/vehicle-management/feedbacks")

  return { success: true }
}

export async function updateBooking(bookingId: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const updateData: any = {
    company_name: formData.get("company_name") as string,
    client_name: formData.get("client_name") as string,
    client_contact: formData.get("client_contact") as string,
    client_address: formData.get("client_address") as string,
    destination_contact_name: formData.get("destination_contact_name") as string,
    destination_contact_phone: formData.get("destination_contact_phone") as string,
    route: formData.get("route") as string,
    number_of_loads: Number.parseInt(formData.get("number_of_loads") as string),
    proposed_client_budget: Number.parseFloat(formData.get("proposed_client_budget") as string),
    timeline: formData.get("timeline") as string,
    request_details: formData.get("request_details") as string,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from("bookings").update(updateData).eq("id", bookingId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Add timeline event
  await supabase.from("job_timeline").insert({
    booking_id: bookingId,
    action_type: "Updated",
    action_by: user.id,
    notes: "Booking details updated",
  })

  revalidatePath("/dashboard/bookings")
  return { success: true }
}

export async function assignDriverWithExpenses(
  bookingId: string,
  driverId: string,
  expenses?: {
    fuelAmount?: number
    fuelLiters?: number
    fuelAccountId?: string
    ticketingAmount?: number
    ticketingAccountId?: string
    allowanceAmount?: number
  },
) {
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
  const updateData: any = {
    assigned_driver_id: driverId,
    assigned_vehicle_id: driver.assigned_vehicle_id,
    status: "Assigned",
  }

  if (expenses) {
    if (expenses.fuelAmount && expenses.fuelAccountId) {
      updateData.fuel_amount = expenses.fuelAmount
      updateData.fuel_account_id = expenses.fuelAccountId
    }
    if (expenses.ticketingAmount && expenses.ticketingAccountId) {
      updateData.ticketing_amount = expenses.ticketingAmount
      updateData.ticketing_account_id = expenses.ticketingAccountId
    }
    if (expenses.allowanceAmount) {
      updateData.allowance_amount = expenses.allowanceAmount
    }
  }

  const { error } = await supabase.from("bookings").update(updateData).eq("id", bookingId)

  if (error) {
    console.error("Error assigning driver:", error)
    return { success: false, error: error.message }
  }

  // Create expense transactions if provided
  if (expenses) {
    const { createExpenseTransaction } = await import("./expenses")

    // Fuel transaction
    if (expenses.fuelAmount && expenses.fuelAccountId) {
      await createExpenseTransaction(expenses.fuelAccountId, {
        bookingId,
        driverId,
        vehicleId: driver.assigned_vehicle_id,
        expenseType: "Fuel",
        amount: expenses.fuelAmount,
        quantity: expenses.fuelLiters,
        unit: "Liters",
        notes: `Fuel for trip ${bookingId}`,
      })
    }

    // Ticketing transaction
    if (expenses.ticketingAmount && expenses.ticketingAccountId) {
      await createExpenseTransaction(expenses.ticketingAccountId, {
        bookingId,
        driverId,
        vehicleId: driver.assigned_vehicle_id,
        expenseType: "Ticketing",
        amount: expenses.ticketingAmount,
        notes: `Government ticketing for trip ${bookingId}`,
      })
    }

    // Allowance transaction - need to get allowance account
    if (expenses.allowanceAmount) {
      const { getPrepaidAccounts } = await import("./expenses")
      const { data: allowanceAccounts } = await getPrepaidAccounts("Allowance")
      if (allowanceAccounts && allowanceAccounts.length > 0) {
        await createExpenseTransaction(allowanceAccounts[0].id, {
          bookingId,
          driverId,
          vehicleId: driver.assigned_vehicle_id,
          expenseType: "Allowance",
          amount: expenses.allowanceAmount,
          notes: `Driver allowance for trip ${bookingId}`,
        })
      }
    }
  }

  revalidatePath("/dashboard/bookings")
  revalidatePath("/dashboard/expenses")
  return { success: true }
}
