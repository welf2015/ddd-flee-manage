import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get driver profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    // Get assigned vehicle
    const { data: vehicle } = await supabase.from("vehicles").select("*").eq("assigned_driver_id", user.id).single()

    // Get total inspections by this driver
    const { count: inspectionCount } = await supabase
      .from("vehicle_inspections")
      .select("*", { count: "only" })
      .eq("inspector_id", user.id)

    return NextResponse.json({
      profile,
      vehicle,
      inspectionCount: inspectionCount || 0,
    })
  } catch (error) {
    console.error("[v0] Driver profile error:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}
