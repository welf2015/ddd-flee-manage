import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { bookingId, action } = await request.json()

    // Update booking status
    const newStatus = action === "approve" ? "Approved" : "Rejected"

    const { error } = await supabase.from("jobs").update({ status: newStatus }).eq("id", bookingId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Approve booking error:", error)
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
  }
}
