import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Auth check
    const authHeader = request.headers.get("Authorization")
    let user = null

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1]
      const { data } = await supabase.auth.getUser(token)
      user = data.user
    } else {
      const { data } = await supabase.auth.getUser()
      user = data.user
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Generate job ID
    const { data: jobIdData, error: jobIdError } = await supabase.rpc("generate_job_id")
    if (jobIdError || !jobIdData) {
      throw new Error("Failed to generate job ID")
    }

    // Check if client exists or create new one
    let clientId = body.client_id

    if (!clientId && body.client_contact) {
      // Try to find existing client by phone
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("phone", body.client_contact)
        .single()

      if (existingClient) {
        clientId = existingClient.id
      } else {
        // Create new client
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({
            name: body.client_name,
            company_name: body.company_name,
            phone: body.client_contact,
            email: body.client_email,
            address: body.client_address,
          })
          .select()
          .single()

        if (clientError) throw clientError
        clientId = newClient.id
      }
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        job_id: jobIdData,
        client_id: clientId,
        route: body.route,
        pickup_address: body.pickup_address,
        delivery_address: body.delivery_address,
        pickup_lat: body.pickup_lat,
        pickup_lng: body.pickup_lng,
        delivery_lat: body.delivery_lat,
        delivery_lng: body.delivery_lng,
        destination_contact_name: body.destination_contact_name,
        destination_contact_phone: body.destination_contact_phone,
        proposed_client_budget: body.proposed_client_budget,
        requires_waybill: body.requires_waybill || false,
        status: "Pending",
        created_by: user.id,
      })
      .select(`
        *,
        client:clients(*),
        vehicle:vehicles(*),
        driver:drivers!assigned_driver_id(*)
      `)
      .single()

    if (bookingError) throw bookingError

    return NextResponse.json({
      success: true,
      booking,
      message: "Booking created successfully"
    })
  } catch (error: any) {
    console.error("[MOBILE API] Create booking error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to create booking"
    }, { status: 500 })
  }
}
