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
      .select("driver_id, amount, transaction_date")
      .eq("transaction_type", "expense")
      .gte("transaction_date", weekStart.toISOString())

    const { data: activeBookings } = await supabase
      .from("bookings")
      .select("assigned_driver_id, job_id")
      .in("status", ["In Progress", "Ongoing"])

    const driversWithData = drivers?.map((driver) => {
      const driverExpenses = recentExpenses?.filter((e) => e.driver_id === driver.id) || []
      const weeklySpent = driverExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

      const todayExpenses = driverExpenses.filter((e) => new Date(e.transaction_date) >= todayStart)
      const dailySpent = todayExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

      const currentJob = activeBookings?.find((b) => b.assigned_driver_id === driver.id)

      return {
        id: driver.id,
        full_name: driver.full_name,
        phone: driver.phone,
        current_job_id: currentJob?.job_id || null,
        weekly_spent: weeklySpent,
        daily_spent: dailySpent,
        account: {
          weekly_spent: weeklySpent,
          daily_spent: dailySpent,
        },
      }
    })

    return NextResponse.json(driversWithData || [])
  } catch (error: any) {
    console.error("[v0] Error fetching drivers:", error.message)
    return NextResponse.json([], { status: 200 })
  }
}
