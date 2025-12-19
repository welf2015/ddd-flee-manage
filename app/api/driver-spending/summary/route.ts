import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get total balance across all driver accounts
    const { data: accounts, error: accountsError } = await supabase
      .from("driver_spending_accounts")
      .select("current_balance")

    if (accountsError) throw accountsError

    const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.current_balance || 0), 0) || 0

    // Get weekly spending (last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { data: transactions, error: txError } = await supabase
      .from("driver_spending_transactions")
      .select("amount, transaction_type")
      .eq("transaction_type", "expense")
      .gte("created_at", weekAgo.toISOString())

    if (txError) throw txError

    const weeklySpending = transactions?.reduce((sum, tx) => sum + Number(tx.amount || 0), 0) || 0

    return NextResponse.json({
      totalBalance,
      weeklySpending,
    })
  } catch (error: any) {
    console.error("[v0] Error fetching driver spending summary:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
