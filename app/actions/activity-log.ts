"use server"

import { createClient } from "@/lib/supabase/server"

export async function getSystemActivityLog(filters?: {
  module?: string
  userId?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  let query = supabase
    .from("system_activity_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })

  // Apply filters
  if (filters?.module) {
    query = query.eq("module", filters.module)
  }

  if (filters?.userId) {
    query = query.eq("user_id", filters.userId)
  }

  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte("created_at", filters.dateTo)
  }

  // Pagination
  const limit = filters?.limit || 50
  const offset = filters?.offset || 0
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error("[v0] Error fetching activity log:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data, count }
}
