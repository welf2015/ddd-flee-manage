"use server"
import { createClient } from "@/lib/supabase/server"

export async function checkTransactions() {
    const supabase = createClient()
    const { data: expenses } = await supabase
        .from("driver_spending_transactions")
        .select("amount, created_at, transaction_type")
        .eq("transaction_type", "expense")
        .order("created_at", { ascending: false })

    console.log("Total Expenses Count:", expenses?.length)
    console.log("Total Sum:", expenses?.reduce((sum, tx) => sum + Number(tx.amount), 0))
    console.log("First 10:", expenses?.slice(0, 10))
}
