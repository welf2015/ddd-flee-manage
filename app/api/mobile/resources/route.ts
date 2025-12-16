import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // "drivers" or "vehicles" or "clients"

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

    let data, error

    switch (type) {
      case "drivers":
        ({ data, error } = await supabase
          .from("drivers")
          .select("*")
          .eq("status", "Active")
          .order("full_name"))
        break

      case "vehicles":
        ({ data, error } = await supabase
          .from("vehicles")
          .select("*")
          .eq("status", "Active")
          .order("registration_number"))
        break

      case "clients":
        ({ data, error } = await supabase
          .from("clients")
          .select("*")
          .order("name"))
        break

      default:
        // Return all resources
        const [driversRes, vehiclesRes, clientsRes] = await Promise.all([
          supabase.from("drivers").select("*").eq("status", "Active").order("full_name"),
          supabase.from("vehicles").select("*").eq("status", "Active").order("registration_number"),
          supabase.from("clients").select("*").order("name")
        ])

        return NextResponse.json({
          success: true,
          drivers: driversRes.data || [],
          vehicles: vehiclesRes.data || [],
          clients: clientsRes.data || []
        })
    }

    if (error) throw error

    return NextResponse.json({
      success: true,
      [type as string]: data || []
    })
  } catch (error: any) {
    console.error("[MOBILE API] Get resources error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to fetch resources"
    }, { status: 500 })
  }
}
