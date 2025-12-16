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
    const { driver_id, vehicle_id } = body

    if (!driver_id && !vehicle_id) {
      return NextResponse.json({
        success: false,
        error: "At least one of driver_id or vehicle_id is required"
      }, { status: 400 })
    }

    const updates: any = {}
    if (driver_id) updates.assigned_driver_id = driver_id
    if (vehicle_id) updates.assigned_vehicle_id = vehicle_id

    // Update booking
    const { data: booking, error: updateError } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", params.id)
      .select(`
        *,
        client:clients(*),
        vehicle:vehicles(*),
        driver:drivers!assigned_driver_id(*)
      `)
      .single()

    if (updateError) throw updateError

    // Add timeline entries
    if (driver_id) {
      const { data: driver } = await supabase
        .from("drivers")
        .select("full_name")
        .eq("id", driver_id)
        .single()

      await supabase.from("job_timeline").insert({
        booking_id: params.id,
        action_type: "Driver Assigned",
        action_by: user.id,
        notes: `Driver ${driver?.full_name} assigned to job`,
      })
    }

    if (vehicle_id) {
      const { data: vehicle } = await supabase
        .from("vehicles")
        .select("registration_number, vehicle_make")
        .eq("id", vehicle_id)
        .single()

      await supabase.from("job_timeline").insert({
        booking_id: params.id,
        action_type: "Vehicle Assigned",
        action_by: user.id,
        notes: `Vehicle ${vehicle?.registration_number} (${vehicle?.vehicle_make}) assigned to job`,
      })
    }

    return NextResponse.json({
      success: true,
      booking,
      message: "Assignment successful"
    })
  } catch (error: any) {
    console.error("[MOBILE API] Assign error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to assign driver/vehicle"
    }, { status: 500 })
  }
}
