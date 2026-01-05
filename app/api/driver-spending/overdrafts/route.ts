import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const supabase = await createClient()

    const { data: drivers, error: driversError } = await supabase
      .from("drivers")
      .select(`
        id,
        full_name,
        phone,
        status,
        driver_spending_accounts (
          id,
          current_balance,
          spending_limit,
          created_at
        )
      `)
      .order("full_name", { ascending: true })

    if (driversError) {
      console.error("[v0] Error fetching drivers for overdraft analysis:", driversError)
      return NextResponse.json({ error: driversError.message }, { status: 500 })
    }

    const { data: recentTransactions } = await supabase
      .from("driver_spending_transactions")
      .select("driver_id, amount, transaction_type, created_at")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    const overdraftData =
      drivers?.map((driver: any) => {
        const account = driver.driver_spending_accounts?.[0]
        const currentBalance = account?.current_balance || 0
        const spendingLimit = account?.spending_limit || 0

        // Calculate overdraft amount (negative balance)
        const overdraftAmount = Math.max(0, -currentBalance)
        const isOverdrawn = currentBalance < 0

        // Get weekly spending trend
        const driverTransactions = recentTransactions?.filter((t) => t.driver_id === driver.id) || []
        const weeklyExpenses = driverTransactions
          .filter((t) => t.transaction_type === "deduction" || t.transaction_type === "expense")
          .reduce((sum, t) => sum + Number(t.amount), 0)

        // Get today's spending
        const todayTransactions = driverTransactions.filter((t) => new Date(t.created_at) >= todayStart)
        const dailyExpenses = todayTransactions
          .filter((t) => t.transaction_type === "deduction" || t.transaction_type === "expense")
          .reduce((sum, t) => sum + Number(t.amount), 0)

        // Calculate percentage of limit used (for context)
        const limitPercentage = spendingLimit > 0 ? ((spendingLimit - currentBalance) / spendingLimit) * 100 : 0

        // Get last transaction date
        const lastTransaction = driverTransactions.length > 0 ? new Date(driverTransactions[0].created_at) : null

        return {
          driver_id: driver.id,
          full_name: driver.full_name,
          phone: driver.phone,
          status: driver.status,
          current_balance: currentBalance,
          spending_limit: spendingLimit,
          overdraft_amount: overdraftAmount,
          is_overdrawn: isOverdrawn,
          limit_percentage_used: Math.round(limitPercentage),
          weekly_expenses: weeklyExpenses,
          daily_expenses: dailyExpenses,
          last_transaction_date: lastTransaction?.toISOString() || null,
          severity: overdraftAmount > spendingLimit * 0.5 ? "critical" : overdraftAmount > 0 ? "warning" : "none",
        }
      }) || []

    const overdrawnDrivers = overdraftData
      .filter((d) => d.is_overdrawn)
      .sort((a, b) => b.overdraft_amount - a.overdraft_amount)
      .slice(0, limit)

    const totalSystemOverdraft = overdraftData.reduce((sum, d) => sum + d.overdraft_amount, 0)
    const totalDriversOverdrawn = overdraftData.filter((d) => d.is_overdrawn).length
    const criticalCount = overdraftData.filter((d) => d.severity === "critical").length

    return NextResponse.json({
      summary: {
        total_system_overdraft: totalSystemOverdraft,
        total_drivers_overdrawn: totalDriversOverdrawn,
        critical_cases: criticalCount,
        average_overdraft: totalDriversOverdrawn > 0 ? Math.round(totalSystemOverdraft / totalDriversOverdrawn) : 0,
      },
      overdrawn_drivers: overdrawnDrivers,
      all_drivers_status: overdraftData,
    })
  } catch (error: any) {
    console.error("[v0] Error fetching overdraft data:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
