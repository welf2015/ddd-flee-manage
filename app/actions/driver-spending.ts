"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getDriversWithAllowanceSpending() {
  const supabase = await createClient()

  // Get all drivers
  const { data: drivers, error: driversError } = await supabase
    .from("drivers")
    .select("id, full_name, phone, status")
    .order("full_name", { ascending: true })

  if (driversError) {
    console.error("[v0] Error fetching drivers:", driversError)
    return { success: false, error: driversError.message, data: [] }
  }

  console.log("[v0] getDriversWithAllowanceSpending: Found", drivers?.length, "drivers")

  // Get today's date range
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

  // Get week start (Monday)
  const dayOfWeek = today.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + mondayOffset).toISOString()

  // Get allowance expenses for all drivers
  const { data: allowanceExpenses, error: expensesError } = await supabase
    .from("expense_transactions")
    .select("driver_id, amount, transaction_date")
    .eq("expense_type", "Allowance")
    .not("driver_id", "is", null)

  if (expensesError) {
    console.error("[v0] Error fetching allowance expenses:", expensesError)
  } else {
    console.log("[v0] Found", allowanceExpenses?.length, "allowance expenses")
  }

  // Get spending accounts for limits and balance
  const { data: spendingAccounts, error: accountsError } = await supabase
    .from("driver_spending_accounts")
    .select("driver_id, current_balance, spending_limit, is_active")

  if (accountsError) {
    console.error("[v0] Error fetching spending accounts:", accountsError)
  } else {
    console.log("[v0] Found", spendingAccounts?.length, "spending accounts")
  }

  // Calculate spending per driver
  const driverSpending = (drivers || []).map((driver) => {
    const driverAllowances = (allowanceExpenses || []).filter((e) => e.driver_id === driver.id)
    const spendingAccount = (spendingAccounts || []).find((a) => a.driver_id === driver.id)

    // Calculate daily spent (today only)
    const dailySpent = driverAllowances
      .filter((e) => {
        const txDate = new Date(e.transaction_date)
        return txDate >= new Date(todayStart) && txDate < new Date(todayEnd)
      })
      .reduce((sum, e) => sum + Number(e.amount), 0)

    // Calculate weekly spent (this week)
    const weeklySpent = driverAllowances
      .filter((e) => {
        const txDate = new Date(e.transaction_date)
        return txDate >= new Date(weekStart)
      })
      .reduce((sum, e) => sum + Number(e.amount), 0)

    // Calculate total spent (all time)
    const totalSpent = driverAllowances.reduce((sum, e) => sum + Number(e.amount), 0)

    return {
      driver_id: driver.id,
      driver: {
        id: driver.id,
        full_name: driver.full_name,
        phone: driver.phone,
        status: driver.status,
      },
      current_balance: spendingAccount?.current_balance || 0,
      spending_limit: spendingAccount?.spending_limit || 0,
      daily_spent: dailySpent,
      weekly_spent: weeklySpent,
      total_spent: totalSpent,
      has_account: !!spendingAccount,
      is_active: spendingAccount?.is_active ?? true,
    }
  })

  return { success: true, data: driverSpending }
}

export async function getDriverSpendingAccounts() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("driver_spending_accounts")
    .select(`
      *,
      driver:drivers(id, full_name, phone, status)
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching driver spending accounts:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function getAllDriversWithAccounts() {
  const supabase = await createClient()

  // Get all drivers
  const { data: drivers, error: driversError } = await supabase
    .from("drivers")
    .select("id, full_name, phone, status")
    .order("full_name", { ascending: true })

  if (driversError) {
    console.error("[v0] getAllDriversWithAccounts: Error fetching drivers:", driversError)
    return { success: false, error: driversError.message, data: [] }
  }

  console.log("[v0] getAllDriversWithAccounts: Found", drivers?.length, "drivers")

  // Get ALL spending accounts in one query
  const { data: accounts, error: accountsError } = await supabase
    .from("driver_spending_accounts")
    .select("driver_id, current_balance, spending_limit, is_active")

  if (accountsError) {
    console.error("[v0] getAllDriversWithAccounts: Error fetching spending accounts:", accountsError)
  } else {
    console.log("[v0] getAllDriversWithAccounts: Found", accounts?.length, "spending accounts")
  }

  // Combine drivers with their accounts
  const driversWithAccounts = (drivers || []).map((driver) => {
    const account = (accounts || []).find((a) => a.driver_id === driver.id)
    return {
      ...driver,
      account: account
        ? {
            current_balance: Number(account.current_balance),
            spending_limit: Number(account.spending_limit),
            is_active: account.is_active,
          }
        : null,
    }
  })

  return { success: true, data: driversWithAccounts }
}

export async function getAllActiveDrivers() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("drivers")
    .select("id, full_name, phone, status")
    .order("full_name", { ascending: true })

  if (error) {
    console.error("Error fetching drivers:", error)
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

export async function getDriverSpendingAccount(driverId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("driver_spending_accounts")
    .select(`
      *,
      driver:drivers(id, full_name, phone, status)
    `)
    .eq("driver_id", driverId)
    .maybeSingle()

  if (error) {
    console.error("Error fetching driver spending account:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function createDriverSpendingAccount(driverId: string, spendingLimit?: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("driver_spending_accounts")
    .insert({
      driver_id: driverId,
      current_balance: 0,
      spending_limit: spendingLimit || 50000,
      weekly_spent: 0,
      daily_spent: 0,
      week_start_date: new Date().toISOString().split("T")[0],
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating driver spending account:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/expenses")
  return { success: true, data }
}

export async function setDriverSpendingLimit(driverId: string, newLimit: number) {
  const supabase = await createClient()

  // Check if account exists
  const existingAccount = await getDriverSpendingAccount(driverId)

  if (existingAccount.data) {
    // Update existing account
    const { error } = await supabase
      .from("driver_spending_accounts")
      .update({
        spending_limit: newLimit,
        updated_at: new Date().toISOString(),
      })
      .eq("driver_id", driverId)

    if (error) {
      console.error("Error updating spending limit:", error)
      return { success: false, error: error.message }
    }
  } else {
    // Create new account with the limit
    const createResult = await createDriverSpendingAccount(driverId, newLimit)
    if (!createResult.success) {
      return createResult
    }
  }

  revalidatePath("/dashboard/expenses")
  return { success: true }
}

export async function topUpDriverAccount(driverId: string, amount: number, description?: string) {
  return topUpDriverSpending(driverId, amount, description)
}

export async function topUpDriverSpending(driverId: string, amount: number, description?: string) {
  const supabase = await createClient()

  // Get or create account
  let account = await getDriverSpendingAccount(driverId)

  if (!account.data) {
    const createResult = await createDriverSpendingAccount(driverId)
    if (!createResult.success) {
      return createResult
    }
    account = await getDriverSpendingAccount(driverId)
  }

  const accountData = account.data!

  // Check if top-up would exceed spending limit
  const newBalance = Number(accountData.current_balance) + amount
  if (newBalance > Number(accountData.spending_limit)) {
    return {
      success: false,
      error: `Top-up would exceed spending limit of ₦${Number(accountData.spending_limit).toLocaleString()}`,
    }
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get week number and year
  const now = new Date()
  const weekNumber = getWeekNumber(now)
  const year = now.getFullYear()

  // Create transaction
  const { error: txError } = await supabase.from("driver_spending_transactions").insert({
    driver_id: driverId,
    account_id: accountData.id,
    transaction_type: "top_up",
    amount,
    description: description || "Account top-up",
    balance_after: newBalance,
    week_number: weekNumber,
    year,
    created_by: user?.id,
  })

  if (txError) {
    console.error("Error creating transaction:", txError)
    return { success: false, error: txError.message }
  }

  // Update account balance
  const { error: updateError } = await supabase
    .from("driver_spending_accounts")
    .update({
      current_balance: newBalance,
      total_topped_up: Number(accountData.total_topped_up) + amount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountData.id)

  if (updateError) {
    console.error("Error updating account:", updateError)
    return { success: false, error: updateError.message }
  }

  revalidatePath("/dashboard/expenses")
  return { success: true }
}

export async function recordDriverExpense(driverId: string, amount: number, description: string, bookingId?: string) {
  const supabase = await createClient()

  // Get account
  const account = await getDriverSpendingAccount(driverId)
  if (!account.data) {
    return { success: false, error: "Driver spending account not found" }
  }

  const accountData = account.data

  const newBalance = Number(accountData.current_balance) - amount
  const newWeeklySpent = Number(accountData.weekly_spent) + amount
  const newDailySpent = Number(accountData.daily_spent || 0) + amount

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get week number and year
  const now = new Date()
  const weekNumber = getWeekNumber(now)
  const year = now.getFullYear()

  // Create transaction
  const { error: txError } = await supabase.from("driver_spending_transactions").insert({
    driver_id: driverId,
    account_id: accountData.id,
    booking_id: bookingId,
    transaction_type: "expense",
    amount,
    description,
    balance_after: newBalance,
    week_number: weekNumber,
    year,
    created_by: user?.id,
  })

  if (txError) {
    console.error("Error creating transaction:", txError)
    return { success: false, error: txError.message }
  }

  const { error: updateError } = await supabase
    .from("driver_spending_accounts")
    .update({
      current_balance: newBalance,
      total_spent: Number(accountData.total_spent) + amount,
      weekly_spent: newWeeklySpent,
      daily_spent: newDailySpent,
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountData.id)

  if (updateError) {
    console.error("Error updating account:", updateError)
    return { success: false, error: updateError.message }
  }

  revalidatePath("/dashboard/expenses")
  return { success: true }
}

export async function updateSpendingLimit(driverId: string, newLimit: number) {
  return setDriverSpendingLimit(driverId, newLimit)
}

export async function getDriverSpendingTransactions(driverId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("driver_spending_transactions")
    .select(`
      *,
      booking:bookings(job_id),
      created_by_profile:profiles(full_name)
    `)
    .eq("driver_id", driverId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching transactions:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function getDriverAllowanceTransactions(driverId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("expense_transactions")
    .select(`
      id,
      amount,
      transaction_date,
      notes,
      created_at,
      booking:bookings(job_id),
      created_by_profile:profiles!expense_transactions_created_by_fkey(full_name)
    `)
    .eq("driver_id", driverId)
    .eq("expense_type", "Allowance")
    .order("transaction_date", { ascending: false })

  if (error) {
    console.error("Error fetching allowance transactions:", error)
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

export async function resetWeeklySpending() {
  const supabase = await createClient()

  // Reset weekly spent for all accounts
  const { error } = await supabase
    .from("driver_spending_accounts")
    .update({
      weekly_spent: 0,
      week_start_date: new Date().toISOString().split("T")[0],
      updated_at: new Date().toISOString(),
    })
    .eq("is_active", true)

  if (error) {
    console.error("Error resetting weekly spending:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/expenses")
  return { success: true }
}

export async function resetDailySpending() {
  const supabase = await createClient()

  const { error } = await supabase
    .from("driver_spending_accounts")
    .update({
      daily_spent: 0,
      last_daily_reset: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("is_active", true)

  if (error) {
    console.error("Error resetting daily spending:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/expenses")
  return { success: true }
}

// Helper function to get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
