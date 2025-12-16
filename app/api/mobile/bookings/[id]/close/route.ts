import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const {
      waybill_url,
      fuel_receipt_url,
      incident_report,
      actual_cost
    } = body

    // Check if booking exists
    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", params.id)
      .single()

    if (!booking) {
      return NextResponse.json({
        success: false,
        error: "Booking not found"
      }, { status: 404 })
    }

    // Check if waybill is required
    if (booking.requires_waybill && !waybill_url) {
      return NextResponse.json({
        success: false,
        error: "Waybill is required to close this job"
      }, { status: 400 })
    }

    // Update booking to Completed status
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "Completed",
        actual_cost: actual_cost || booking.proposed_client_budget,
        completed_at: new Date().toISOString(),
      })
      .eq("id", params.id)

    if (updateError) throw updateError

    // Upload waybill if provided
    if (waybill_url) {
      const urlParts = waybill_url.split("/")
      const filename = urlParts[urlParts.length - 1] || "waybill"

      await supabase.from("waybill_uploads").insert({
        booking_id: params.id,
        file_url: waybill_url,
        file_name: filename,
        file_type: filename.includes(".pdf") ? "application/pdf" : "image/jpeg",
        document_type: "Waybill",
        uploaded_by: user.id,
      })

      await supabase.from("job_timeline").insert({
        booking_id: params.id,
        action_type: "Waybill Uploaded",
        action_by: user.id,
        notes: "Waybill document uploaded",
      })
    }

    // Upload fuel receipt if provided
    if (fuel_receipt_url) {
      const urlParts = fuel_receipt_url.split("/")
      const filename = urlParts[urlParts.length - 1] || "fuel-receipt"

      await supabase.from("waybill_uploads").insert({
        booking_id: params.id,
        file_url: fuel_receipt_url,
        file_name: filename,
        file_type: filename.includes(".pdf") ? "application/pdf" : "image/jpeg",
        document_type: "Fuel Receipt",
        uploaded_by: user.id,
      })

      await supabase.from("job_timeline").insert({
        booking_id: params.id,
        action_type: "Fuel Receipt Uploaded",
        action_by: user.id,
        notes: "Fuel receipt uploaded",
      })
    }

    // Add incident report if provided
    if (incident_report) {
      await supabase.from("job_timeline").insert({
        booking_id: params.id,
        action_type: "Incident Reported",
        action_by: user.id,
        notes: incident_report,
      })
    }

    // Add completion timeline
    await supabase.from("job_timeline").insert({
      booking_id: params.id,
      action_type: "Job Completed",
      action_by: user.id,
      notes: "Job closed successfully",
    })

    // Fetch updated booking
    const { data: updatedBooking } = await supabase
      .from("bookings")
      .select(`
        *,
        client:clients(*),
        vehicle:vehicles(*),
        driver:drivers!assigned_driver_id(*),
        waybills:waybill_uploads(*)
      `)
      .eq("id", params.id)
      .single()

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: "Job closed successfully"
    })
  } catch (error: any) {
    console.error("[MOBILE API] Close job error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to close job"
    }, { status: 500 })
  }
}
