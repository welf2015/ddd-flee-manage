"use server"

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { notifyNegotiationEvent } from "@/lib/notifications"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const amount = Number(body.amount)
    const eventType = body.eventType as "proposed" | "counter" | "approved"

    if (!body.bookingId || Number.isNaN(amount) || !eventType) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    await notifyNegotiationEvent({
      bookingId: body.bookingId,
      amount,
      eventType,
      initiatedByUserId: user.id,
      initiatedByRole: profile?.role || "Staff",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[notifications] negotiation email failed", error)
    return NextResponse.json({ error: "Failed to send negotiation notification" }, { status: 500 })
  }
}


