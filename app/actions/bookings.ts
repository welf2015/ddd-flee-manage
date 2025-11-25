"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { notifyAdminsForBookingApproval, notifyStatusChange, notifyPaymentReceived } from "@/lib/notifications"

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
    fuelReceiptUrl: string | null
    incidentReport: string | null
    additionalCosts: string
    actualCost: number | null
  },
) {
  console.log("🔒 [closeBooking] Called with:", { bookingId, data })
  
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("🔒 [closeBooking] User check:", { userId: user?.id, authenticated: !!user })

  if (!user) {
    console.error("🔒 [closeBooking] Not authenticated")
    return { success: false, error: "Not authenticated" }
  }

  const { data: existingBooking, error: bookingFetchError } = await supabase
    .from("bookings")
    .select("job_id, client_name, status")
    .eq("id", bookingId)
    .single()

  console.log("🔒 [closeBooking] Booking fetch:", { existingBooking, bookingFetchError })

  if (bookingFetchError || !existingBooking) {
    console.error("🔒 [closeBooking] Booking not found:", bookingFetchError)
    return { success: false, error: "Booking not found" }
  }

  // Update booking to Completed status with Unpaid payment status
  console.log("🔒 [closeBooking] Updating booking status...")
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
    console.error("🔒 [closeBooking] Error updating booking:", bookingError)
    return { success: false, error: bookingError.message }
  }

  console.log("🔒 [closeBooking] Booking updated successfully")

  // Upload waybill if provided
  if (data.waybillUrl) {
    console.log("🔒 [closeBooking] Inserting waybill:", { waybillUrl: data.waybillUrl })
    const urlParts = data.waybillUrl.split("/")
    const filename = urlParts[urlParts.length - 1] || "waybill"
    
    const { error: waybillError } = await supabase.from("waybill_uploads").insert({
      booking_id: bookingId,
      file_url: data.waybillUrl,
      file_name: filename,
      file_type: filename.includes(".pdf") ? "application/pdf" : "image/jpeg",
      document_type: "Waybill",
      uploaded_by: user.id,
    })

    if (waybillError) {
      console.error("🔒 [closeBooking] Error inserting waybill:", waybillError)
    } else {
      console.log("🔒 [closeBooking] Waybill inserted successfully")
    }

    const { error: timelineError } = await supabase.from("job_timeline").insert({
      booking_id: bookingId,
      action_type: "Waybill Uploaded",
      action_by: user.id,
      notes: "Waybill document uploaded",
    })

    if (timelineError) {
      console.error("🔒 [closeBooking] Error inserting timeline:", timelineError)
    }
  }

  // Upload fuel receipt if provided
  if (data.fuelReceiptUrl) {
    console.log("🔒 [closeBooking] Inserting fuel receipt:", { fuelReceiptUrl: data.fuelReceiptUrl })
    const urlParts = data.fuelReceiptUrl.split("/")
    const filename = urlParts[urlParts.length - 1] || "fuel-receipt"
    
    const { error: fuelReceiptError } = await supabase.from("waybill_uploads").insert({
      booking_id: bookingId,
      file_url: data.fuelReceiptUrl,
      file_name: filename,
      file_type: filename.includes(".pdf") ? "application/pdf" : "image/jpeg",
      document_type: "Fuel Receipt",
      uploaded_by: user.id,
    })

    if (fuelReceiptError) {
      console.error("🔒 [closeBooking] Error inserting fuel receipt:", fuelReceiptError)
    } else {
      console.log("🔒 [closeBooking] Fuel receipt inserted successfully")
    }

    const { error: timelineError } = await supabase.from("job_timeline").insert({
      booking_id: bookingId,
      action_type: "Fuel Receipt Uploaded",
      action_by: user.id,
      notes: "Fuel receipt document uploaded",
    })

    if (timelineError) {
      console.error("🔒 [closeBooking] Error inserting timeline:", timelineError)
    }
  }

  // Create incident if reported
  if (data.incidentReport) {
    console.log("🔒 [closeBooking] Creating incident report...")
    const { data: booking, error: bookingFetchError } = await supabase
      .from("bookings")
      .select("assigned_vehicle_id, assigned_driver_id")
      .eq("id", bookingId)
      .single()

    if (bookingFetchError) {
      console.error("🔒 [closeBooking] Error fetching booking for incident:", bookingFetchError)
    } else if (booking) {
      const { error: incidentError } = await supabase.from("incidents").insert({
        incident_number: `INC-${Date.now()}`,
        vehicle_id: booking.assigned_vehicle_id,
        driver_id: booking.assigned_driver_id,
        incident_date: new Date().toISOString(),
        description: data.incidentReport,
        severity: "Medium",
        status: "Open",
      })

      if (incidentError) {
        console.error("🔒 [closeBooking] Error creating incident:", incidentError)
      } else {
        console.log("🔒 [closeBooking] Incident created successfully")
      }
    }
  }

  console.log("🔒 [closeBooking] Sending notifications...")
  try {
    await notifyStatusChange({
      jobId: existingBooking.job_id,
      clientName: existingBooking.client_name,
      oldStatus: existingBooking.status,
      newStatus: "Completed",
      changedBy: user.id,
      notifyRoles: ["MD", "ED", "Head of Operations"],
      bookingId,
    })
  } catch (notifyError) {
    console.error("🔒 [closeBooking] Error sending notifications:", notifyError)
    // Don't fail the operation if notification fails
  }

  console.log("🔒 [closeBooking] Revalidating paths...")
  revalidatePath("/dashboard/bookings")
  revalidatePath("/dashboard/drivers")
  
  console.log("🔒 [closeBooking] Success!")
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

  await notifyPaymentReceived(bookingId, user.id)

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
    client_email: formData.get("client_email") as string,
    client_address: formData.get("client_address") as string,
    destination_contact_name: formData.get("destination_contact_name") as string,
    destination_contact_phone: formData.get("destination_contact_phone") as string,
    pickup_address: formData.get("pickup_address") as string,
    delivery_address: formData.get("delivery_address") as string,
    route: formData.get("route") as string,
    number_of_loads: Number.parseInt(formData.get("number_of_loads") as string),
    timeline: formData.get("timeline") as string,
    request_details: formData.get("request_details") as string,
    updated_at: new Date().toISOString(),
  }

  // Add coordinates if provided
  const pickupLat = formData.get("pickup_lat")
  const pickupLng = formData.get("pickup_lng")
  const deliveryLat = formData.get("delivery_lat")
  const deliveryLng = formData.get("delivery_lng")

  if (pickupLat) updateData.pickup_lat = Number.parseFloat(pickupLat as string)
  if (pickupLng) updateData.pickup_lng = Number.parseFloat(pickupLng as string)
  if (deliveryLat) updateData.delivery_lat = Number.parseFloat(deliveryLat as string)
  if (deliveryLng) updateData.delivery_lng = Number.parseFloat(deliveryLng as string)

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
    // Always set fuel_amount (even if 0) for accounting purposes - REQUIRED
    if (expenses.fuelAccountId !== undefined) {
      updateData.fuel_amount = expenses.fuelAmount ?? 0
      updateData.fuel_account_id = expenses.fuelAccountId
      console.log("💰 [assignDriverWithExpenses] Setting fuel_amount:", updateData.fuel_amount)
    } else {
      console.warn("⚠️ [assignDriverWithExpenses] No fuelAccountId provided, but expenses object exists")
    }
    // Set ticketing amount if provided
    if (expenses.ticketingAccountId !== undefined && expenses.ticketingAmount !== undefined) {
      updateData.ticketing_amount = expenses.ticketingAmount
      updateData.ticketing_account_id = expenses.ticketingAccountId
      console.log("💰 [assignDriverWithExpenses] Setting ticketing_amount:", updateData.ticketing_amount)
    }
    // Set allowance amount if provided
    if (expenses.allowanceAmount !== undefined) {
      updateData.allowance_amount = expenses.allowanceAmount
      console.log("💰 [assignDriverWithExpenses] Setting allowance_amount:", updateData.allowance_amount)
    }
  } else {
    console.warn("⚠️ [assignDriverWithExpenses] No expenses object provided")
  }
  
  console.log("📝 [assignDriverWithExpenses] Update data:", updateData)

  const { error, data: updatedBooking } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", bookingId)
    .select("fuel_amount, ticketing_amount, allowance_amount")
    .single()

  if (error) {
    console.error("❌ [assignDriverWithExpenses] Error updating booking:", error)
    return { success: false, error: error.message }
  }
  
  console.log("✅ [assignDriverWithExpenses] Booking updated successfully:", {
    fuel_amount: updatedBooking?.fuel_amount,
    ticketing_amount: updatedBooking?.ticketing_amount,
    allowance_amount: updatedBooking?.allowance_amount,
  })

  // Create expense transactions - fuel is always required for accounting
  // First, check if transactions already exist for this booking to prevent duplicates
  const { data: existingTransactions } = await supabase
    .from("expense_transactions")
    .select("id, expense_type")
    .eq("booking_id", bookingId)

  const hasFuelTransaction = existingTransactions?.some((t) => t.expense_type === "Fuel")
  const hasTicketingTransaction = existingTransactions?.some((t) => t.expense_type === "Ticketing")
  const hasAllowanceTransaction = existingTransactions?.some((t) => t.expense_type === "Allowance")

  if (expenses) {
    const { createExpenseTransaction } = await import("./expenses")

    // Fuel transaction - always created (even if amount is 0) - but only if it doesn't exist
    if (expenses.fuelAccountId && !hasFuelTransaction) {
      const fuelAmount = expenses.fuelAmount ?? 0
      const fuelLiters = expenses.fuelLiters ?? 0

      const fuelResult = await createExpenseTransaction(expenses.fuelAccountId, {
        bookingId,
        driverId,
        vehicleId: driver.assigned_vehicle_id,
        expenseType: "Fuel",
        amount: fuelAmount,
        quantity: fuelLiters,
        unit: "Liters",
        notes: fuelAmount > 0 ? `Fuel for trip ${bookingId}` : `No fuel expense for trip ${bookingId}`,
      })

      if (!fuelResult.success) {
        console.error("Failed to create fuel transaction:", fuelResult.error)
      } else if (fuelResult.data) {
        // Directly create fuel log since we have all the data
        // This is more reliable than relying on triggers
        const supabase = await createClient()

        // Get vendor name for station
        const { data: accountData } = await supabase
          .from("prepaid_accounts")
          .select("vendor:expense_vendors(vendor_name)")
          .eq("id", expenses.fuelAccountId)
          .single()

        const stationName = accountData?.vendor?.vendor_name || "Total Energies"

        // Get vehicle fuel type (default to Petrol as user specified)
        const { data: vehicleData } = await supabase
          .from("vehicles")
          .select("fuel_type")
          .eq("id", driver.assigned_vehicle_id)
          .single()

        const fuelType = vehicleData?.fuel_type || "Petrol"

        // Create fuel log directly
        const { error: fuelLogError } = await supabase.from("fuel_logs").insert({
          vehicle_id: driver.assigned_vehicle_id,
          driver_id: driverId,
          booking_id: bookingId,
          fuel_type: fuelType,
          quantity: fuelLiters,
          unit: "Liters",
          cost: fuelAmount,
          station_name: stationName,
          logged_at: new Date().toISOString(),
          expense_transaction_id: fuelResult.data.id,
        })

        if (fuelLogError) {
          console.error("Failed to create fuel log:", fuelLogError)
          // Don't fail the assignment, just log the error
        } else {
          console.log("✅ Fuel log created successfully for transaction:", fuelResult.data.id)
        }
      }
    } else if (hasFuelTransaction) {
      console.log("ℹ️ [assignDriverWithExpenses] Fuel transaction already exists, skipping")
    }

    // Ticketing transaction - only create if it doesn't exist
    if (expenses.ticketingAmount && expenses.ticketingAccountId && !hasTicketingTransaction) {
      const ticketingResult = await createExpenseTransaction(expenses.ticketingAccountId, {
        bookingId,
        driverId,
        vehicleId: driver.assigned_vehicle_id,
        expenseType: "Ticketing",
        amount: expenses.ticketingAmount,
        notes: `Government ticketing for trip ${bookingId}`,
      })
      if (!ticketingResult.success) {
        console.error("Failed to create ticketing transaction:", ticketingResult.error)
      }
    } else if (hasTicketingTransaction) {
      console.log("ℹ️ [assignDriverWithExpenses] Ticketing transaction already exists, skipping")
    }

    // Allowance transaction - need to get allowance account - only create if it doesn't exist
    if (expenses.allowanceAmount && !hasAllowanceTransaction) {
      const { getPrepaidAccounts } = await import("./expenses")
      const { data: allowanceAccounts } = await getPrepaidAccounts("Allowance")
      const allowanceOnly = allowanceAccounts?.filter((a: any) => a.vendor?.vendor_type === "Allowance") || []
      if (allowanceOnly.length > 0) {
        const allowanceResult = await createExpenseTransaction(allowanceOnly[0].id, {
          bookingId,
          driverId,
          vehicleId: driver.assigned_vehicle_id,
          expenseType: "Allowance",
          amount: expenses.allowanceAmount,
          notes: `Driver allowance for trip ${bookingId}`,
        })
        if (!allowanceResult.success) {
          console.error("Failed to create allowance transaction:", allowanceResult.error)
        }
      }
    } else if (hasAllowanceTransaction) {
      console.log("ℹ️ [assignDriverWithExpenses] Allowance transaction already exists, skipping")
    }
  }

  revalidatePath("/dashboard/bookings")
  revalidatePath("/dashboard/expenses")
  return { success: true }
}

export async function deleteBooking(bookingId: string) {
  console.log("🗑️ [Server Action] deleteBooking called with bookingId:", bookingId)
  
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("🗑️ [Server Action] User check:", { userId: user?.id, authenticated: !!user })

  if (!user) {
    console.error("🗑️ [Server Action] Not authenticated")
    return { success: false, error: "Not authenticated" }
  }

  // Check user role - only MD and ED can delete
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single()

  console.log("🗑️ [Server Action] Profile check:", { profile, profileError, role: profile?.role })

  if (profileError) {
    console.error("🗑️ [Server Action] Error fetching profile:", profileError)
    return { success: false, error: `Failed to fetch user profile: ${profileError.message}` }
  }

  if (!profile || !["MD", "ED"].includes(profile.role)) {
    console.warn("🗑️ [Server Action] Unauthorized - role check failed:", { role: profile?.role, allowed: ["MD", "ED"] })
    return { success: false, error: "Unauthorized: Only MD and ED can delete bookings" }
  }

  // Get booking info before deleting (including assigned driver)
  const { data: booking, error: bookingFetchError } = await supabase
    .from("bookings")
    .select("job_id, client_name, assigned_driver_id")
    .eq("id", bookingId)
    .single()

  console.log("🗑️ [Server Action] Booking fetch:", { booking, bookingFetchError })

  if (bookingFetchError || !booking) {
    console.error("🗑️ [Server Action] Booking not found:", bookingFetchError)
    return { success: false, error: "Booking not found" }
  }

  // Update driver status to Active before deleting booking
  if (booking.assigned_driver_id) {
    console.log("🗑️ [Server Action] Updating driver status to Active:", { driverId: booking.assigned_driver_id })
    const { error: driverUpdateError } = await supabase
      .from("drivers")
      .update({
        status: "Active",
        current_job_id: null,
      })
      .eq("id", booking.assigned_driver_id)

    if (driverUpdateError) {
      console.error("🗑️ [Server Action] Error updating driver status:", driverUpdateError)
      // Don't fail the deletion if driver update fails, but log it
    } else {
      console.log("🗑️ [Server Action] Driver status updated successfully")
    }
  }

  // Log the deletion action in deletion_log table (persists even after booking is deleted)
  const { error: logError } = await supabase.from("deletion_log").insert({
    module: "Booking",
    reference_id: booking.job_id,
    reference_uuid: bookingId,
    deleted_by: user.id,
    deleted_by_role: profile.role,
    deleted_by_name: profile.full_name || user.email || "Unknown",
    deleted_by_email: profile.email || user.email || null,
    description: `Booking ${booking.job_id} (${booking.client_name}) deleted by ${profile.full_name || profile.role}`,
    metadata: {
      booking_id: bookingId,
      job_id: booking.job_id,
      client_name: booking.client_name,
    },
  })
  console.log("🗑️ [Server Action] Logged deletion action:", { error: logError })

  console.log("🗑️ [Server Action] Starting deletion of related records...")

  // Refund expenses if booking has expenses (for jobs that were in transit or had expenses)
  const { data: expenseTransactions, error: expensesFetchError } = await supabase
    .from("expense_transactions")
    .select("id, account_id, expense_type, amount, notes")
    .eq("booking_id", bookingId)

  console.log("🗑️ [Server Action] Found expense transactions:", { 
    count: expenseTransactions?.length || 0, 
    error: expensesFetchError 
  })

  if (expenseTransactions && expenseTransactions.length > 0) {
    console.log("🗑️ [Server Action] Processing refunds for expenses...")
    
    // Group expenses by account_id to create refund top-ups
    const refundsByAccount = new Map<string, { amount: number; types: string[] }>()
    
    for (const transaction of expenseTransactions) {
      const accountId = transaction.account_id
      const existing = refundsByAccount.get(accountId) || { amount: 0, types: [] }
      refundsByAccount.set(accountId, {
        amount: existing.amount + parseFloat(transaction.amount.toString()),
        types: [...existing.types, transaction.expense_type],
      })
    }

    // Create refund top-ups for each account
    for (const [accountId, refund] of refundsByAccount.entries()) {
      const { error: refundError } = await supabase.from("account_topups").insert({
        account_id: accountId,
        amount: refund.amount,
        deposited_by: user.id,
        notes: `Refund for deleted booking ${booking.job_id} - Expenses: ${refund.types.join(", ")}`,
        receipt_number: `REFUND-${booking.job_id}-${Date.now()}`,
      })
      
      console.log("🗑️ [Server Action] Created refund top-up:", { 
        accountId, 
        amount: refund.amount, 
        error: refundError 
      })
    }
  }

  // Delete related records first (due to foreign keys)
  const { error: filesError } = await supabase.from("booking_files").delete().eq("booking_id", bookingId)
  console.log("🗑️ [Server Action] Deleted booking_files:", { error: filesError })

  const { error: negotiationsError } = await supabase.from("negotiation_threads").delete().eq("booking_id", bookingId)
  console.log("🗑️ [Server Action] Deleted negotiation_threads:", { error: negotiationsError })

  const { error: timelineError } = await supabase.from("job_timeline").delete().eq("booking_id", bookingId)
  console.log("🗑️ [Server Action] Deleted job_timeline:", { error: timelineError })

  const { error: costsError } = await supabase.from("job_costs").delete().eq("booking_id", bookingId)
  console.log("🗑️ [Server Action] Deleted job_costs:", { error: costsError })

  const { error: notificationsError } = await supabase.from("notifications").delete().eq("booking_id", bookingId)
  console.log("🗑️ [Server Action] Deleted notifications:", { error: notificationsError })

  // Delete the booking
  console.log("🗑️ [Server Action] Deleting main booking record...")
  const { error, data } = await supabase.from("bookings").delete().eq("id", bookingId).select()

  if (error) {
    console.error("🗑️ [Server Action] Error deleting booking:", error)
    return { success: false, error: error.message }
  }

  console.log("🗑️ [Server Action] Delete query result:", { data, error })

  // Verify deletion
  const { data: verifyBooking } = await supabase.from("bookings").select("id").eq("id", bookingId).single()
  
  if (verifyBooking) {
    console.error("🗑️ [Server Action] WARNING: Booking still exists after deletion attempt!", { bookingId })
    return { success: false, error: "Booking deletion failed - record still exists" }
  }

  console.log("🗑️ [Server Action] Booking deleted successfully! Verified deletion. Revalidating path...")
  revalidatePath("/dashboard/bookings")
  return { success: true }
}
