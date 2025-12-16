import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(
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
    const { status, notes } = body

    if (!status) {
      return NextResponse.json({
        success: false,
        error: "Status is required"
      }, { status: 400 })
    }

    // Valid statuses
    const validStatuses = [
      "Pending",
      "Negotiating",
      "Approved",
      "In Progress",
      "Completed",
      "Cancelled"
    ]

    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        error: "Invalid status"
      }, { status: 400 })
    }

    // Update booking status
    const { data: booking, error: updateError } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", params.id)
      .select(`
        *,
        client:clients(*),
        vehicle:vehicles(*),
        driver:drivers!assigned_driver_id(*)
      `)
      .single()

    if (updateError) throw updateError

    // Add timeline entry
    await supabase.from("job_timeline").insert({
      booking_id: params.id,
      action_type: `Status Changed to ${status}`,
      action_by: user.id,
      notes: notes || `Status updated to ${status}`,
    })

    return NextResponse.json({
      success: true,
      booking,
      message: "Status updated successfully"
    })
  } catch (error: any) {
    console.error("[MOBILE API] Update status error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to update status"
    }, { status: 500 })
  }
}
