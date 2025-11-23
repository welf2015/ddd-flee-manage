"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getExpenseVendors() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("expense_vendors").select("*").order("vendor_name")
  return { data: data || [], error }
}

export async function getPrepaidAccounts(vendorType?: string) {
  const supabase = await createClient()
  let query = supabase
    .from("prepaid_accounts")
    .select("*, vendor:expense_vendors(*)")
    .eq("is_active", true)
    .order("account_name")

  if (vendorType) {
    query = query.eq("vendor.vendor_type", vendorType)
  }

  const { data, error } = await query
  return { data: data || [], error }
}

export async function getAccountBalance(accountId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("prepaid_accounts")
    .select("current_balance, total_deposited, total_spent")
    .eq("id", accountId)
    .single()

  return { data, error }
}

export async function addAccountTopup(
  accountId: string,
  data: {
    amount: number
    receiptNumber?: string
    receiptUrl?: string
    notes?: string
  },
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase.from("account_topups").insert({
    account_id: accountId,
    amount: data.amount,
    receipt_number: data.receiptNumber,
    receipt_url: data.receiptUrl,
    deposited_by: user.id,
    notes: data.notes,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/expenses")
  return { success: true }
}

export async function createExpenseTransaction(
  accountId: string,
  data: {
    bookingId?: string
    driverId?: string
    vehicleId?: string
    expenseType: "Fuel" | "Ticketing" | "Allowance"
    amount: number
    quantity?: number
    unit?: string
    notes?: string
  },
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: transaction, error } = await supabase
    .from("expense_transactions")
    .insert({
      account_id: accountId,
      booking_id: data.bookingId,
      driver_id: data.driverId,
      vehicle_id: data.vehicleId,
      expense_type: data.expenseType,
      amount: data.amount,
      quantity: data.quantity,
      unit: data.unit,
      notes: data.notes,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Update booking with expense amounts if bookingId exists
  if (data.bookingId) {
    const updateData: any = {}
    if (data.expenseType === "Fuel") {
      updateData.fuel_amount = data.amount
      updateData.fuel_account_id = accountId
    } else if (data.expenseType === "Ticketing") {
      updateData.ticketing_amount = data.amount
      updateData.ticketing_account_id = accountId
    } else if (data.expenseType === "Allowance") {
      updateData.allowance_amount = data.amount
    }

    await supabase.from("bookings").update(updateData).eq("id", data.bookingId)
  }

  revalidatePath("/dashboard/expenses")
  revalidatePath("/dashboard/bookings")
  return { success: true, data: transaction }
}

export async function getExpenseTransactions(filters?: {
  accountId?: string
  expenseType?: string
  bookingId?: string
  startDate?: string
  endDate?: string
}) {
  const supabase = await createClient()
  let query = supabase
    .from("expense_transactions")
    .select(
      `
      *,
      account:prepaid_accounts(account_name, vendor:expense_vendors(vendor_name)),
      booking:bookings(job_id),
      driver:drivers(full_name),
      vehicle:vehicles(vehicle_number)
    `,
    )
    .order("transaction_date", { ascending: false })

  if (filters?.accountId) {
    query = query.eq("account_id", filters.accountId)
  }
  if (filters?.expenseType) {
    query = query.eq("expense_type", filters.expenseType)
  }
  if (filters?.bookingId) {
    query = query.eq("booking_id", filters.bookingId)
  }
  if (filters?.startDate) {
    query = query.gte("transaction_date", filters.startDate)
  }
  if (filters?.endDate) {
    query = query.lte("transaction_date", filters.endDate)
  }

  const { data, error } = await query
  return { data: data || [], error }
}

export async function getTopups(accountId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from("account_topups")
    .select(
      `
      *,
      account:prepaid_accounts(account_name, vendor:expense_vendors(vendor_name)),
      deposited_by_profile:profiles!account_topups_deposited_by_fkey(full_name)
    `,
    )
    .order("topup_date", { ascending: false })

  if (accountId) {
    query = query.eq("account_id", accountId)
  }

  const { data, error } = await query
  return { data: data || [], error }
}

export async function getWeeklyExpenses() {
  const supabase = await createClient()
  const now = new Date()
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
  weekStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from("expense_transactions")
    .select("amount, expense_type")
    .gte("transaction_date", weekStart.toISOString())

  if (error) {
    return { data: 0, error }
  }

  const total = data?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0
  return { data: total, error: null }
}

export async function getTotalFuelSpent() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("expense_transactions")
    .select("amount")
    .eq("expense_type", "Fuel")

  if (error) {
    return { data: 0, error }
  }

  const total = data?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0
  return { data: total, error: null }
}

