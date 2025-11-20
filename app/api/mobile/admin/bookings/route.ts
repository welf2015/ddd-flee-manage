import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const authHeader = request.headers.get("Authorization")
    let user = null

    if (authHeader && authHeader.startsWith("Bearer ")) {
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

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "MD" && profile?.role !== "Admin" && profile?.role !== "Manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get new bookings (Pending status)
    const { data: newBookings } = await supabase
      .from("jobs")
      .select("*, client:clients(*), vehicle:vehicles(*)")
      .eq("status", "Pending")
      .order("created_at", { ascending: false })

    return NextResponse.json({ bookings: newBookings || [] })
  } catch (error) {
    console.error("[v0] Admin bookings error:", error)
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
  }
}
