import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const week = searchParams.get('week') || 'current'
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Unified query for ALL Ledger transactions
    let query = supabase
      .from("driver_spending_transactions")
      .select(`
        *,
        driver:drivers(full_name, phone),
        booking:bookings(job_id),
        account:driver_spending_accounts(id) 
      `)
      .is('deleted_at', null) // Ledger: Ignore soft deleted
      .order("created_at", { ascending: false })

    // Apply week filtering
    if (week === 'all') {
      query = query.limit(200)
    } else if (week !== 'current' && week !== 'previous') {
      const weekNumber = parseInt(week)
      query = query.eq('week_number', weekNumber).eq('year', year)
    } else if (week === 'current') {
      const currentWeek = getWeekNumber(new Date())
      query = query.eq('week_number', currentWeek).eq('year', year)
    } else if (week === 'previous') {
      const currentWeek = getWeekNumber(new Date())
      query = query.lt('week_number', currentWeek).eq('year', year).order('week_number', { ascending: false }).limit(100)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching driver transactions:", error.message)
      return NextResponse.json([], { status: 200 })
    }

    const transactions = data?.map((tx) => ({
      id: tx.id,
      driver_name: tx.driver?.full_name,
      driver_phone: tx.driver?.phone,
      job_id: tx.booking?.job_id,
      transaction_type: tx.transaction_type, // 'expense', 'top_up', 'adjustment', 'reversal'
      direction: tx.direction, // CREDIT / DEBIT (New)
      amount: tx.amount,
      transaction_date: tx.created_at,
      balance_after: tx.balance_after,
      notes: tx.description || tx.notes,
      week_number: tx.week_number,
      year: tx.year,
      type: tx.transaction_type
    }))

    return NextResponse.json(transactions || [])
  } catch (error: any) {
    console.error("[v0] Error fetching driver transactions:", error.message)
    return NextResponse.json([], { status: 200 })
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
