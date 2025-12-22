import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Helper to get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const weekParam = searchParams.get('week') || 'current'
    const yearParam = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear()

    const supabase = await createClient()

    // 1. Fetch Summary Data
    const [{ data: allTransactions, error: txError }, { data: accounts, error: accError }] = await Promise.all([
      supabase.from("driver_spending_transactions").select("amount, transaction_type, created_at, week_number, year"),
      supabase.from("driver_spending_accounts").select("current_balance")
    ])

    if (txError || accError) {
      console.error("Error fetching summary data:", txError || accError)
      throw txError || accError
    }

    // 2. Separate into Expenses and Top-ups for "Spent" metrics
    const allExpenses = allTransactions?.filter(t => t.transaction_type === 'expense' || t.transaction_type === 'manual_debit') || []
    const totalExpensesAmount = allExpenses.reduce((sum, t) => sum + Number(t.amount), 0)

    // Total Balance: Sum of all account balances for consistency with UI
    const totalBalance = accounts?.reduce((sum, target) => sum + Number(target.current_balance), 0) || 0

    // 3. Calculate "Spent This Week" based on Filter
    let weeklyExpenses = []

    if (weekParam === 'all') {
      weeklyExpenses = allExpenses
    } else if (weekParam === 'current') {
      const currentWeekPayload = getWeekNumber(new Date())
      const currentYear = new Date().getFullYear()
      weeklyExpenses = allExpenses.filter(t => t.week_number === currentWeekPayload && t.year === currentYear)
    } else if (weekParam === 'previous') {
      const currentWeekPayload = getWeekNumber(new Date())
      weeklyExpenses = allExpenses.filter(t => t.week_number < currentWeekPayload && t.year === yearParam)
    } else {
      // Specific week number
      const w = parseInt(weekParam)
      weeklyExpenses = allExpenses.filter(t => t.week_number === w && t.year === yearParam)
    }

    const weeklySpending = weeklyExpenses.reduce((sum, t) => sum + Number(t.amount), 0)

    // 4. Daily Spending (Always Today, regardless of filter)
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const dailySpending = allExpenses.filter(t => t.created_at >= todayStart)
      .reduce((sum, t) => sum + Number(t.amount), 0)

    return NextResponse.json({
      totalBalance: totalBalance,
      totalAvailable: totalBalance, // Legacy field name compatibility
      weeklySpending: weeklySpending,
      dailySpending: dailySpending,
      totalSpent: totalExpensesAmount
    })
  } catch (error: any) {
    console.error("[v0] Error fetching driver spending summary:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
