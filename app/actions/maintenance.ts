"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createMaintenanceSchedule(data: any) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { data: existingSchedules } = await supabase
      .from("maintenance_schedules")
      .select("schedule_number")
      .order("created_at", { ascending: false })
      .limit(1)

    let scheduleNumber = "MS-001"
    if (existingSchedules && existingSchedules.length > 0) {
      const lastNumber = existingSchedules[0].schedule_number
      const numPart = Number.parseInt(lastNumber.split("-")[1]) || 0
      scheduleNumber = `MS-${String(numPart + 1).padStart(3, "0")}`
    }

    console.log("[v0] Creating maintenance schedule with number:", scheduleNumber)

    const { data: newSchedule, error } = await supabase
      .from("maintenance_schedules")
      .insert({
        ...data,
        schedule_number: scheduleNumber,
        scheduled_by: user.id,
        status: "Pending",
      })
      .select()

    if (error) {
      console.log("[v0] Maintenance schedule error:", error)
      throw error
    }

    console.log("[v0] Maintenance schedule created:", newSchedule)

    revalidatePath("/dashboard/vehicle-management/maintenance")
    return { success: true }
  } catch (error: any) {
    console.log("[v0] Maintenance schedule error:", error)
    return { success: false, error: error.message }
  }
}

export async function approveMaintenanceSchedule(scheduleId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase
      .from("maintenance_schedules")
      .update({
        status: "Approved",
        approved_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", scheduleId)

    if (error) throw error

    revalidatePath("/dashboard/vehicle-management/maintenance")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function rejectMaintenanceSchedule(scheduleId: string, reason: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("maintenance_schedules")
      .update({
        status: "Rejected",
        completion_notes: `Rejected: ${reason}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", scheduleId)

    if (error) throw error

    revalidatePath("/dashboard/vehicle-management/maintenance")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateMaintenanceStatus(
  scheduleId: string,
  status: string,
  actualCost?: number,
  completionNotes?: string,
) {
  try {
    const supabase = await createClient()

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === "In Progress") {
      updateData.started_at = new Date().toISOString()
    }

    if (status === "Completed") {
      updateData.completed_at = new Date().toISOString()
      if (actualCost) updateData.actual_cost = actualCost
      if (completionNotes) updateData.completion_notes = completionNotes
    }

    const { error } = await supabase.from("maintenance_schedules").update(updateData).eq("id", scheduleId)

    if (error) throw error

    revalidatePath("/dashboard/vehicle-management/maintenance")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
