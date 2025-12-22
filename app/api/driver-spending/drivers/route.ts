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

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    const dayOfWeek = now.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() + diff)
    weekStart.setHours(0, 0, 0, 0)

    const { data: recentExpenses } = await supabase
      .from("driver_spending_transactions")
      .select("driver_id, amount, created_at")
      .eq("transaction_type", "expense")
      .gte("created_at", weekStart.toISOString())

    const { data: accounts } = await supabase
      .from("driver_spending_accounts")
      .select("driver_id, current_balance, spending_limit, weekly_spent, daily_spent")

    const { data: activeBookings } = await supabase
      .from("bookings")
      .select("assigned_driver_id, job_id")
      .in("status", ["In Progress", "Ongoing", "Assigned"])

    const driversWithData = drivers?.map((driver) => {
      const driverExpenses = recentExpenses?.filter((e) => e.driver_id === driver.id) || []
      const weeklySpentCalculated = driverExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

      const todayExpenses = driverExpenses.filter((e) => new Date(e.created_at) >= todayStart)
      const dailySpentCalculated = todayExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

      const currentJob = activeBookings?.find((b) => b.assigned_driver_id === driver.id)
      const account = accounts?.find(a => a.driver_id === driver.id)

      return {
        id: driver.id,
        full_name: driver.full_name,
        phone: driver.phone,
        current_job_id: currentJob?.job_id || null,
        weekly_spent: weeklySpentCalculated,
        daily_spent: dailySpentCalculated,
        current_balance: account?.current_balance || 0,
        spending_limit: account?.spending_limit || 0,
        account: {
          ...account,
          weekly_spent: weeklySpentCalculated, // Prioritize ledger-calculated for UI consistency
          daily_spent: dailySpentCalculated,
          current_balance: account?.current_balance || 0
        },
      }
    })

    return NextResponse.json(driversWithData || [])
  } catch (error: any) {
    console.error("[v0] Error fetching drivers:", error.message)
    return NextResponse.json([], { status: 200 })
  }
}
