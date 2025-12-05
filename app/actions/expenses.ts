"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { notifyTopup } from "@/lib/notifications"
import { recordDriverExpense } from "@/app/actions/driver-spending"

export async function getExpenseVendors() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("expense_vendors").select("*").order("vendor_name")
  return { data: data || [], error }
}

export async function getPrepaidAccounts(vendorType?: string) {
  const supabase = await createClient()
  const query = supabase
    .from("prepaid_accounts")
    .select(
      "id, account_name, current_balance, total_deposited, total_spent, is_active, created_at, updated_at, vendor_id, vendor:expense_vendors!prepaid_accounts_vendor_id_fkey(*)",
    )
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

  // Deduct from driver spending account ONLY for Allowance
  if (data.expenseType === "Allowance" && data.driverId) {
    const description = data.notes || `Allowance for booking ${data.bookingId || "N/A"}`
    const deductResult = await recordDriverExpense(data.driverId, data.amount, description, data.bookingId)
    if (!deductResult.success) {
      console.log("Note: Could not deduct from driver spending account:", deductResult.error)
      // Don't fail the transaction, just log the issue
      // The driver may not have a spending account yet
    } else {
      console.log(`✅ Deducted ₦${data.amount} from driver allowance account`)
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

  const mappedData = (data || []).map((topup: any) => ({
    ...topup,
    topup_type: topup.topup_type || (topup.receipt_number?.startsWith("REFUND") ? "refund" : "topup"),
  }))

  return { data: mappedData, error }
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
  const { data, error } = await supabase.from("expense_transactions").select("amount").eq("expense_type", "Fuel")

  if (error) {
    return { data: 0, error }
  }

  const total = data?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0
  return { data: total, error: null }
}

export async function deleteExpenseTransaction(transactionId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Check if user is admin (MD or ED)
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || !["MD", "ED"].includes(profile.role)) {
    return { success: false, error: "Only MD/ED can delete expense transactions" }
  }

  // Get transaction details before deletion for logging
  const { data: transaction } = await supabase
    .from("expense_transactions")
    .select("*, booking:bookings(job_id)")
    .eq("id", transactionId)
    .single()

  if (!transaction) {
    return { success: false, error: "Transaction not found" }
  }

  // Delete the transaction
  const { error } = await supabase.from("expense_transactions").delete().eq("id", transactionId)

  if (error) {
    console.error("Error deleting expense transaction:", error)
    return { success: false, error: error.message }
  }

  console.log(`✅ Expense transaction deleted: ${transactionId} (${transaction.expense_type} - ₦${transaction.amount})`)

  revalidatePath("/dashboard/expenses")
  revalidatePath("/dashboard/bookings")
  return { success: true }
}

export async function updateExpenseTransaction(
  transactionId: string,
  data: {
    amount?: number
    quantity?: number
    unit?: string
    notes?: string
    expenseType?: "Fuel" | "Ticketing" | "Allowance"
  },
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Check if user is admin (MD or ED)
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || !["MD", "ED"].includes(profile.role)) {
    return { success: false, error: "Only MD/ED can edit expense transactions" }
  }

  // Build update object with only provided fields
  const updateData: any = {}
  if (data.amount !== undefined) updateData.amount = data.amount
  if (data.quantity !== undefined) updateData.quantity = data.quantity
  if (data.unit !== undefined) updateData.unit = data.unit
  if (data.notes !== undefined) updateData.notes = data.notes
  if (data.expenseType !== undefined) updateData.expense_type = data.expenseType

  const { data: updated, error } = await supabase
    .from("expense_transactions")
    .update(updateData)
    .eq("id", transactionId)
    .select()
    .single()

  if (error) {
    console.error("Error updating expense transaction:", error)
    return { success: false, error: error.message }
  }

  console.log(`✅ Expense transaction updated: ${transactionId}`)

  revalidatePath("/dashboard/expenses")
  revalidatePath("/dashboard/bookings")
  return { success: true, data: updated }
}
