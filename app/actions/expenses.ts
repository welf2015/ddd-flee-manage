"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { notifyTopup } from "@/lib/notifications"

export async function getExpenseVendors() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("expense_vendors").select("*").order("vendor_name")
  return { data: data || [], error }
}

export async function getPrepaidAccounts(vendorType?: string) {
  const supabase = await createClient()
  let query = supabase
    .from("prepaid_accounts")
    .select("id, account_name, current_balance, total_deposited, total_spent, is_active, created_at, updated_at, vendor_id, vendor:expense_vendors!prepaid_accounts_vendor_id_fkey(*)")
    .eq("is_active", true)
    .order("account_name")

  const { data, error } = await query
  
  if (error) {
    console.error("Error fetching prepaid accounts:", error)
    return { data: [], error }
  }

  // Filter by vendor type if specified (client-side filtering for now)
  let filteredData = data || []
  if (vendorType && data) {
    filteredData = data.filter((account: any) => account.vendor?.vendor_type === vendorType)
  }

  return { data: filteredData, error: null }
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

  await notifyTopup({
    accountId,
    amount: data.amount,
    depositedBy: user.id,
    receiptNumber: data.receiptNumber,
  })

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
      transaction_date: new Date().toISOString(),
      notes: data.notes,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating expense transaction:", error)
    return { success: false, error: error.message }
  }

  if (!transaction) {
    console.error("Transaction was not created")
    return { success: false, error: "Transaction was not created" }
  }

  console.log("Expense transaction created successfully:", transaction.id)

  // Update booking table with expense amounts if bookingId is provided
  if (data.bookingId) {
    const bookingUpdate: any = {}
    
    // Update the appropriate expense field based on expense type
    if (data.expenseType === "Fuel") {
      bookingUpdate.fuel_amount = data.amount
      bookingUpdate.fuel_account_id = accountId
    } else if (data.expenseType === "Ticketing") {
      bookingUpdate.ticketing_amount = data.amount
      bookingUpdate.ticketing_account_id = accountId
    } else if (data.expenseType === "Allowance") {
      bookingUpdate.allowance_amount = data.amount
    }

    // Update driver and vehicle if provided (for manual expense logging)
    if (data.driverId) {
      bookingUpdate.assigned_driver_id = data.driverId
    }
    if (data.vehicleId) {
      bookingUpdate.assigned_vehicle_id = data.vehicleId
    }

    // Only update if there are fields to update
    if (Object.keys(bookingUpdate).length > 0) {
      const { error: updateError } = await supabase
        .from("bookings")
        .update(bookingUpdate)
        .eq("id", data.bookingId)

      if (updateError) {
        console.error("Error updating booking with expense amounts:", updateError)
        // Don't fail the transaction if booking update fails, but log it
      } else {
        console.log("✅ Booking updated with expense amounts:", bookingUpdate)
      }
    }
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

export async function getWeeklyExpenses(expenseType?: string) {
  const supabase = await createClient()
  const now = new Date()
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
  weekStart.setHours(0, 0, 0, 0)

  let query = supabase
    .from("expense_transactions")
    .select("amount, expense_type")
    .gte("transaction_date", weekStart.toISOString())

  if (expenseType) {
    query = query.eq("expense_type", expenseType)
  }

  const { data, error } = await query

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
