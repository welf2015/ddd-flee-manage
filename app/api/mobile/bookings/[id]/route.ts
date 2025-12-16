import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
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

    // Get booking with all related data
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        *,
        client:clients(*),
        vehicle:vehicles(*),
        driver:drivers!assigned_driver_id(*),
        waybills:waybill_uploads(*),
        timeline:job_timeline(*, user:profiles(full_name, email)),
        expenses:trip_expenses(*)
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({
          success: false,
          error: "Booking not found"
        }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      booking
    })
  } catch (error: any) {
    console.error("[MOBILE API] Get booking details error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to fetch booking details"
    }, { status: 500 })
  }
}
