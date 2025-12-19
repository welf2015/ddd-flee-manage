import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: drivers, error: driversError } = await supabase
      .from("drivers")
      .select(`
        id,
        full_name,
        phone
      `)
      .order("full_name", { ascending: true })

    if (driversError) {
      console.error("[v0] Error fetching drivers:", driversError.message)
      return NextResponse.json([], { status: 200 })
    }

    // Get spending accounts
    const { data: accounts } = await supabase
      .from("driver_spending_accounts")
      .select("driver_id, current_balance, spending_limit")

    // Get current jobs to check driver status
    const { data: activeBookings } = await supabase
      .from("bookings")
      .select("driver_id, job_id")
      .in("status", ["In Progress", "Ongoing"])

    // Get weekly spending (last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { data: weeklyTransactions } = await supabase
      .from("driver_spending")
      .select("driver_id, amount")
      .eq("transaction_type", "expense")
      .gte("created_at", weekAgo.toISOString())

    // Combine data
    const driversWithData = drivers?.map((driver) => {
      const account = accounts?.find((a) => a.driver_id === driver.id)
      const currentJob = activeBookings?.find((b) => b.driver_id === driver.id)
      const weeklySpending =
        weeklyTransactions
          ?.filter((tx) => tx.driver_id === driver.id)
          .reduce((sum, tx) => sum + Number(tx.amount || 0), 0) || 0

      return {
        id: driver.id,
        full_name: driver.full_name,
        phone_number: driver.phone,
        current_job_id: currentJob?.job_id || null,
        current_balance: account?.current_balance || 0,
        spending_limit: account?.spending_limit || 0,
        weekly_spending: weeklySpending,
      }
    })

    return NextResponse.json(driversWithData || [])
  } catch (error: any) {
    console.error("[v0] Error fetching drivers:", error.message)
    return NextResponse.json([], { status: 200 })
  }
}
