import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(
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

    // Check user role - only admins can delete
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "MD" && profile?.role !== "ED" && profile?.role !== "Admin") {
      return NextResponse.json({
        success: false,
        error: "Only admins can delete bookings"
      }, { status: 403 })
    }

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

    // Delete booking (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from("bookings")
      .delete()
      .eq("id", params.id)

    if (deleteError) throw deleteError

    return NextResponse.json({
      success: true,
      message: "Booking deleted successfully"
    })
  } catch (error: any) {
    console.error("[MOBILE API] Delete booking error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to delete booking"
    }, { status: 500 })
  }
}
