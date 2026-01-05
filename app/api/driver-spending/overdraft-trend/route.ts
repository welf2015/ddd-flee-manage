import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const daysParam = Number.parseInt(searchParams.get("days") || "30")

    const supabase = await createClient()

    // Get all driver spending transactions for the period
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysParam)

    const { data: transactions } = await supabase
      .from("driver_spending_transactions")
      .select("created_at, driver_id, amount, transaction_type")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true })

    // Get current driver balances
    const { data: accounts } = await supabase.from("driver_spending_accounts").select("driver_id, current_balance")

    // Create daily breakdown
    const dailyData: Record<
      string,
      {
        date: string
        total_system_overdraft: number
        drivers_overdrawn: number
        critical_drivers: number
      }
    > = {}

    if (transactions) {
      for (const tx of transactions) {
        const date = new Date(tx.created_at).toISOString().split("T")[0]

        if (!dailyData[date]) {
          dailyData[date] = {
            date,
            total_system_overdraft: 0,
            drivers_overdrawn: 0,
            critical_drivers: 0,
          }
        }
      }

      // Calculate overdraft for each driver on each day
      for (const date of Object.keys(dailyData).sort()) {
        const dateTime = new Date(date)
        const balancesByDriver: Record<string, number> = {}

        // For each driver, sum up transactions up to this date
        if (accounts) {
          for (const account of accounts) {
            const driverId = account.driver_id
            const historicalTransactions = transactions.filter(
              (t) =>
                t.driver_id === driverId &&
                new Date(t.created_at) <= dateTime &&
                (t.transaction_type === "deduction" || t.transaction_type === "expense"),
            )

            const spent = historicalTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
            const currentBalance = account.current_balance
            const originalLimit = currentBalance + spent

            balancesByDriver[driverId] = Math.max(0, -(originalLimit - spent))
          }
        }

        const overdrafts = Object.values(balancesByDriver).filter((o) => o > 0)
        dailyData[date].total_system_overdraft = overdrafts.reduce((sum, o) => sum + o, 0)
        dailyData[date].drivers_overdrawn = overdrafts.length
        dailyData[date].critical_drivers = overdrafts.filter((o) => o > 50000).length
      }
    }

    const trendData = Object.values(dailyData).slice(-daysParam)

    return NextResponse.json({
      period_days: daysParam,
      data: trendData,
    })
  } catch (error: any) {
    console.error("[v0] Error fetching overdraft trend:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
