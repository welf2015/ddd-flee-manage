import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get("driverId")

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get this week's transactions
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { data, error } = await supabase
      .from("driver_spending_transactions")
      .select(`
        *,
        booking:bookings(job_id)
      `)
      .eq("driver_id", driverId)
      .gte("created_at", weekAgo.toISOString())
      .order("created_at", { ascending: false })

    if (error) throw error

    const transactions = data?.map((tx) => ({
      id: tx.id,
      job_id: tx.booking?.job_id,
      transaction_type: tx.transaction_type,
      amount: tx.amount,
      transaction_date: tx.created_at,
      balance_after: tx.balance_after,
      notes: tx.description,
    }))

    return NextResponse.json(transactions || [])
  } catch (error: any) {
    console.error("[v0] Error fetching driver transactions:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
