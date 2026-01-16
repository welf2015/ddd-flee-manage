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

async function recalculateAccountBalance(supabase: any, accountId: string) {
  // Get all topups (deposits, refunds, adjustments)
  const { data: topups } = await supabase.from("account_topups").select("amount").eq("account_id", accountId)

  const totalDeposits = (topups || []).reduce((sum: number, t: any) => sum + (t.amount || 0), 0)

  // Get all expense transactions (debits)
  const { data: transactions } = await supabase
    .from("expense_transactions")
    .select("amount")
    .eq("account_id", accountId)

  const totalSpent = (transactions || []).reduce((sum: number, t: any) => sum + (t.amount || 0), 0)

  // Calculate true balance
  const trueBalance = totalDeposits - totalSpent

  return { trueBalance, totalDeposits, totalSpent }
}

export async function getPrepaidAccounts(vendorType?: string) {
  const supabase = await createClient()

  const query = supabase
    .from("prepaid_accounts")
    .select(
      `
        id, 
        account_name, 
        is_active, 
        created_at, 
        updated_at, 
        vendor_id, 
        current_balance,
        total_deposited,
        total_spent,
        vendor:expense_vendors!prepaid_accounts_vendor_id_fkey(*)
      `,
    )
    .eq("is_active", true)
    .order("account_name")

  const { data, error } = await query

  if (error) {
    console.error("Error fetching prepaid accounts:", error)
    return { data: [], error }
  }

  const accountsWithCorrectBalances = await Promise.all(
    (data || []).map(async (account: any) => {
      const { trueBalance, totalDeposits, totalSpent } = await recalculateAccountBalance(supabase, account.id)

      // If stored balance doesn't match calculated balance, update it
      if (account.current_balance !== trueBalance) {
        console.log(
          `[v0] Balance mismatch for ${account.account_name}: stored=${account.current_balance}, calculated=${trueBalance}. Updating...`,
        )
        await supabase.from("prepaid_accounts").update({ current_balance: trueBalance }).eq("id", account.id)
      }

      return {
        ...account,
        current_balance: trueBalance,
        total_deposited: totalDeposits,
        total_spent: totalSpent,
      }
    }),
  )

  let filteredData = accountsWithCorrectBalances
  if (vendorType) {
    filteredData = accountsWithCorrectBalances.filter((account: any) => account.vendor?.vendor_type === vendorType)
  }

  return { data: filteredData, error: null }
}

export async function getAccountBalance(accountId: string) {
  const supabase = await createClient()

  const { data: account, error } = await supabase
    .from("prepaid_accounts")
    .select(
      `
        id,
        account_name,
        account_topups(amount),
        expense_transactions(amount)
      `,
    )
    .eq("id", accountId)
    .single()

  if (error) {
    console.error("Error fetching account:", error)
    return { data: null, error }
  }

  // Calculate totals from actual data
  const totalDeposited = (account.account_topups || []).reduce(
    (sum: number, topup: any) => sum + (topup.amount || 0),
    0,
  )
  const totalSpent = (account.expense_transactions || []).reduce(
    (sum: number, transaction: any) => sum + (transaction.amount || 0),
    0,
  )
  const currentBalance = totalDeposited - totalSpent

  return {
    data: {
      id: account.id,
      account_name: account.account_name,
      current_balance: currentBalance,
      total_deposited: totalDeposited,
      total_spent: totalSpent,
    },
    error: null,
  }
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

  const { data: account } = await supabase
    .from("prepaid_accounts")
    .select("current_balance, account_name")
    .eq("id", accountId)
    .single()

  if (!account) {
    return { success: false, error: "Account not found" }
  }

  const currentBalance = account.current_balance || 0
  const overdraftAmount = currentBalance < 0 ? Math.abs(currentBalance) : 0

  const { error: topupError } = await supabase.from("account_topups").insert({
    account_id: accountId,
    amount: data.amount,
    receipt_number: data.receiptNumber,
    receipt_url: data.receiptUrl,
    deposited_by: user.id,
    notes: data.notes,
  })

  if (topupError) {
    return { success: false, error: topupError.message }
  }

  if (overdraftAmount > 0) {
    const { error: debitError } = await supabase.from("expense_transactions").insert({
      account_id: accountId,
      expense_type: "Overdraft",
      amount: overdraftAmount,
      transaction_date: new Date().toISOString(),
      notes: `Overdraft debit from ${account.account_name} - paid from topup of ₦${data.amount}`,
      created_by: user.id,
    })

    if (debitError) {
      console.error("Error creating overdraft debit transaction:", debitError)
    }
  }

  const { trueBalance } = await recalculateAccountBalance(supabase, accountId)
  const { error: balanceError } = await supabase
    .from("prepaid_accounts")
    .update({ current_balance: trueBalance })
    .eq("id", accountId)

  if (balanceError) {
    console.error("Error updating balance:", balanceError)
    return { success: false, error: "Topup recorded but balance update failed" }
  }

  await notifyTopup({
    accountId,
    amount: data.amount,
    depositedBy: user.id,
    receiptNumber: data.receiptNumber,
  })

  console.log(`✅ Topup recorded and balance updated to: ₦${trueBalance}`)

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

  // Fallback to fetch driverId from booking if not provided (crucial for balance deductions)
  let realDriverId = data.driverId
  if (!realDriverId && data.bookingId) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("assigned_driver_id")
      .eq("id", data.bookingId)
      .single()
    if (booking?.assigned_driver_id) {
      realDriverId = booking.assigned_driver_id
      console.log(`ℹ️ [expenses] Using assigned driver ${realDriverId} from booking ${data.bookingId || "N/A"}`)
    }
  }

  const { data: transaction, error } = await supabase
    .from("expense_transactions")
    .insert({
      account_id: accountId,
      booking_id: data.bookingId,
      driver_id: realDriverId, // Use the resolved driver ID
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

  // Calculate Monday of current week as start
  const dayOfWeek = now.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // If Sunday, go back 6 days, otherwise go to Monday
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + diff)
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7) // Add 7 days to get next Monday

  console.log(
    "[v0] Weekly calculation - Start date:",
    weekStart.toISOString(),
    "End date:",
    weekEnd.toISOString(),
    "Current date:",
    now.toISOString(),
  )

  let query = supabase
    .from("expense_transactions")
    .select("amount, expense_type, transaction_date")
    .gte("transaction_date", weekStart.toISOString())
    .lt("transaction_date", weekEnd.toISOString()) // Only get transactions until next Monday

  if (expenseType) {
    query = query.eq("expense_type", expenseType)
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Error fetching weekly expenses:", error)
    return { data: 0, error }
  }

  console.log("[v0] Weekly transactions found:", data?.length)
  const total = data?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0
  console.log("[v0] Weekly total for", expenseType || "all types:", total)

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

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single()

  const allowedRoles = ["MD", "ED", "Head of Operations", "Operations", "Fleet Officer"]
  if (!profile || !allowedRoles.includes(profile.role)) {
    return {
      success: false,
      error: "Only MD, ED, Head of Operations, Operations, and Fleet Officer can delete expense transactions",
    }
  }

  const { data: transaction, error: fetchError } = await supabase
    .from("expense_transactions")
    .select("*, booking:bookings(job_id), account:prepaid_accounts(id, account_name), driver:drivers(full_name)")
    .eq("id", transactionId)
    .maybeSingle()

  if (fetchError) {
    console.error("Error fetching transaction:", fetchError)
    return { success: false, error: "Error fetching transaction details" }
  }

  if (!transaction) {
    return { success: false, error: "Transaction not found" }
  }

  const { error: refundError } = await supabase.from("account_topups").insert({
    account_id: transaction.account?.id,
    amount: transaction.amount,
    topup_type: "REFUND",
    topup_date: new Date().toISOString(),
  })

  if (refundError) {
    console.error("Error recording refund:", refundError)
    return { success: false, error: "Error recording refund" }
  }

  const { error: deleteError } = await supabase.from("expense_transactions").delete().eq("id", transactionId)

  if (deleteError) {
    console.error("Error deleting transaction:", deleteError)
    return { success: false, error: "Error deleting transaction" }
  }

  const { trueBalance } = await recalculateAccountBalance(supabase, transaction.account?.id)
  await supabase.from("prepaid_accounts").update({ current_balance: trueBalance }).eq("id", transaction.account?.id)

  console.log(
    `✅ Expense transaction deleted and refunded: ${transactionId} (${transaction.expense_type} - ₦${transaction.amount})`,
  )
  console.log(`✅ Refunded to account: ${transaction.account?.account_name}`)
  console.log(`✅ Updated balance to: ₦${trueBalance}`)

  revalidatePath("/dashboard/expenses")
  revalidatePath("/dashboard/bookings")
  revalidatePath("/dashboard/accountability")
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

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  const allowedRoles = ["MD", "ED", "Head of Operations", "Operations", "Fleet Officer"]
  if (!profile || !allowedRoles.includes(profile.role)) {
    return {
      success: false,
      error: "Only MD, ED, Head of Operations, Operations, and Fleet Officer can edit expense transactions",
    }
  }

  const { data: originalTransaction } = await supabase
    .from("expense_transactions")
    .select("*, booking:bookings(job_id), account:prepaid_accounts(*)")
    .eq("id", transactionId)
    .single()

  if (!originalTransaction) {
    return { success: false, error: "Transaction not found" }
  }

  // Build update object with only provided fields
  const updateData: any = {}
  if (data.amount !== undefined) updateData.amount = data.amount
  if (data.quantity !== undefined) updateData.quantity = data.quantity
  if (data.unit !== undefined) updateData.unit = data.unit
  if (data.notes !== undefined) updateData.notes = data.notes
  if (data.expenseType !== undefined) updateData.expense_type = data.expenseType

  const { error } = await supabase.from("expense_transactions").update(updateData).eq("id", transactionId)

  if (error) {
    console.error("Error updating expense transaction:", error)
    return { success: false, error: error.message }
  }

  if (data.amount !== undefined && data.amount !== originalTransaction.amount) {
    const difference = data.amount - originalTransaction.amount
    const jobId = originalTransaction.booking?.job_id || "Unknown"

    if (difference !== 0) {
      // Create adjustment entry
      const adjustmentType = difference > 0 ? "topup" : "refund"
      const adjustmentAmount = Math.abs(difference)

      await supabase.from("account_topups").insert({
        account_id: originalTransaction.account_id,
        amount: difference > 0 ? adjustmentAmount : -adjustmentAmount,
        topup_type: adjustmentType,
        topup_date: new Date().toISOString(),
        receipt_number: `ADJ-${adjustmentType.toUpperCase()}-${Date.now()}`,
        notes: `Adjustment ${difference > 0 ? "deduction" : "refund"} for ${originalTransaction.expense_type} expense edit on ${jobId}. Changed from ₦${originalTransaction.amount.toLocaleString()} to ₦${data.amount.toLocaleString()} (${difference > 0 ? "+" : ""}₦${difference.toLocaleString()}).`,
        deposited_by: user.id,
      })

      console.log(
        `✅ Created adjustment entry: ${difference > 0 ? "Deducted" : "Refunded"} ₦${adjustmentAmount.toLocaleString()} for ${jobId}`,
      )

      const { trueBalance } = await recalculateAccountBalance(supabase, originalTransaction.account_id)
      await supabase
        .from("prepaid_accounts")
        .update({ current_balance: trueBalance })
        .eq("id", originalTransaction.account_id)
      console.log(`✅ Updated stored balance to: ₦${trueBalance}`)
    }
  }

  console.log(`✅ Expense transaction updated: ${transactionId}`)

  revalidatePath("/dashboard/expenses")
  revalidatePath("/dashboard/bookings")
  return { success: true }
}

export async function deleteTopup(topupId: string) {
  console.log("[v0] deleteTopup called with ID:", topupId)
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] User authenticated:", user?.id)

  if (!user) {
    console.log("[v0] User not authenticated")
    return { success: false, error: "Not authenticated" }
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single()

  console.log("[v0] User profile:", profile)

  const allowedRoles = ["MD", "ED", "Head of Operations", "Operations", "Fleet Officer"]
  if (!profile || !allowedRoles.includes(profile.role)) {
    console.log("[v0] User not authorized, role:", profile?.role)
    return {
      success: false,
      error: "Only MD, ED, Head of Operations, Operations, and Fleet Officer can delete topup transactions",
    }
  }

  // Get topup details before deletion for logging
  console.log("[v0] Fetching topup details for ID:", topupId)
  const { data: topup, error: fetchError } = await supabase
    .from("account_topups")
    .select(
      "*, account:prepaid_accounts(account_name, current_balance, total_deposited, vendor:expense_vendors(vendor_name))",
    )
    .eq("id", topupId)
    .maybeSingle()

  console.log("[v0] Topup fetch result:", { topup, fetchError })

  if (fetchError) {
    console.error("[v0] Error fetching topup:", fetchError)
    return { success: false, error: "Error fetching topup details" }
  }

  if (!topup) {
    console.log("[v0] Topup not found for ID:", topupId)
    return { success: false, error: "Topup not found" }
  }

  console.log("[v0] Creating reversal entry for deleted topup")
  const { error: reversalError } = await supabase.from("account_topups").insert({
    account_id: topup.account_id,
    amount: -topup.amount, // Negative to reverse the topup
    topup_type: "REVERSAL",
    topup_date: new Date().toISOString(),
    receipt_number: `REV-${topupId.substring(0, 8)}`,
    notes: `Reversal of deleted topup (original amount: ₦${topup.amount.toLocaleString()})`,
    deposited_by: user.id,
  })

  if (reversalError) {
    console.error("[v0] Error creating reversal entry:", reversalError)
    return { success: false, error: "Error creating reversal entry" }
  }

  console.log("[v0] Deleting topup from account_topups table, ID:", topupId)
  // Delete the topup
  const { error } = await supabase.from("account_topups").delete().eq("id", topupId)

  if (error) {
    console.error("[v0] Error deleting topup:", error)
    return { success: false, error: error.message }
  }

  console.log("[v0] Topup deleted successfully")

  console.log(`[v0] ✅ Topup deleted: ${topupId} (₦${topup.amount})`)
  console.log(`[v0] Action performed by: ${profile.role} (${profile.full_name})`)

  revalidatePath("/dashboard/expenses")
  revalidatePath("/dashboard/accountability")
  return { success: true }
}

export const addTopUp = addAccountTopup
