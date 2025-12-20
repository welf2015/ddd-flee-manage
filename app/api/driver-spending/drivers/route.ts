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

    // Get spending accounts (Central only really matters, but we might want to see if any exist)
    // Actually, we don't care about individual accounts anymore.
    // We want individual SPENDING stats (from transactions).

    // Calculate Weekly Spent (Last 7 Days)
    const now = new Date()
    const weekAgo = new Date()
    weekAgo.setDate(now.getDate() - 7)

    const { data: recentExpenses } = await supabase
      .from("driver_spending_transactions")
      .select("driver_id, amount, created_at")
      .eq("transaction_type", "expense")
      .gte("created_at", weekAgo.toISOString())

    // Get current jobs to check driver status
    const { data: activeBookings } = await supabase
      .from("bookings")
      .select("driver_id, job_id")
      .in("status", ["In Progress", "Ongoing"])

    // Combine data
    const driversWithData = drivers?.map((driver) => {
      // Aggregate spending for this driver
      const driverExpenses = recentExpenses?.filter(e => e.driver_id === driver.id)
      const weeklySpent = driverExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

      const currentJob = activeBookings?.find((b) => b.driver_id === driver.id)

      return {
        id: driver.id,
        full_name: driver.full_name,
        phone_number: driver.phone,
        current_job_id: currentJob?.job_id || null,
        current_balance: 0, // No individual balance
        spending_limit: 0, // No limit
        weekly_spent: weeklySpent,
        account: {
          current_balance: 0,
          spending_limit: 0,
          weekly_spent: weeklySpent,
        }
      }
    })

    return NextResponse.json(driversWithData || [])
  } catch (error: any) {
    console.error("[v0] Error fetching drivers:", error.message)
    return NextResponse.json([], { status: 200 })
  }
}
