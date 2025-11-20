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

    // Get fleet stats
    const { count: totalVehicles } = await supabase.from("vehicles").select("*", { count: "only" })

    const { count: activeVehicles } = await supabase
      .from("vehicles")
      .select("*", { count: "only" })
      .eq("status", "Active")

    const { count: totalBookings } = await supabase.from("jobs").select("*", { count: "only" })

    const { count: pendingBookings } = await supabase
      .from("jobs")
      .select("*", { count: "only" })
      .eq("status", "Pending")

    const { data: revenueData } = await supabase
      .from("jobs")
      .select("final_amount")
      .in("status", ["Completed", "Approved"])

    const totalRevenue = revenueData?.reduce((sum, job) => sum + (job.final_amount || 0), 0) || 0

    return NextResponse.json({
      totalVehicles: totalVehicles || 0,
      activeVehicles: activeVehicles || 0,
      totalBookings: totalBookings || 0,
      pendingBookings: pendingBookings || 0,
      totalRevenue,
    })
  } catch (error) {
    console.error("[v0] Stats error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
