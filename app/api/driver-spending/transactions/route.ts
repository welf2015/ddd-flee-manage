import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("driver_spending")
      .select(`
        *,
        driver:drivers(full_name, phone),
        booking:bookings(job_id)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching driver transactions:", error.message)
      return NextResponse.json([], { status: 200 })
    }

    const transactions = data?.map((tx) => ({
      id: tx.id,
      driver_name: tx.driver?.full_name,
      driver_phone: tx.driver?.phone,
      job_id: tx.booking?.job_id,
      transaction_type: tx.transaction_type,
      amount: tx.amount,
      transaction_date: tx.created_at,
      balance_after: tx.balance_after,
      notes: tx.notes,
    }))

    return NextResponse.json(transactions || [])
  } catch (error: any) {
    console.error("[v0] Error fetching driver transactions:", error.message)
    return NextResponse.json([], { status: 200 })
  }
}
