import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

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

    // Get user profile for role-based filtering
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    // Build query
    let query = supabase
      .from("bookings")
      .select(`
        *,
        client:clients(*),
        vehicle:vehicles(*),
        driver:drivers!assigned_driver_id(*),
        waybills:waybill_uploads(*)
      `)
      .order("created_at", { ascending: false })

    // Filter by status if provided
    const status = searchParams.get("status")
    if (status) {
      query = query.eq("status", status)
    }

    // Filter by date range if provided
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    if (startDate) {
      query = query.gte("created_at", startDate)
    }
    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    // Limit results (pagination)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    query = query.range(offset, offset + limit - 1)

    const { data: bookings, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      bookings: bookings || [],
      total: bookings?.length || 0
    })
  } catch (error: any) {
    console.error("[MOBILE API] List bookings error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to fetch bookings"
    }, { status: 500 })
  }
}
