"use server"

import { createClient } from "@/lib/supabase/server"

export async function getPendingInspectionsCount() {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from("vehicle_inspections")
    .select("*", { count: "exact", head: true })
    .eq("status", "Pending")

  if (error) {
    console.error("[v0] Error fetching pending inspections count:", error)
    return 0
  }

  return count || 0
}

export async function approveInspection(inspectionId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("vehicle_inspections")
    .update({
      status: "Approved",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", inspectionId)

  if (error) {
    console.error("[v0] Error approving inspection:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function rejectInspection(inspectionId: string, reason: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("vehicle_inspections")
    .update({
      status: "Rejected",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      supervisor_review: reason,
    })
    .eq("id", inspectionId)

  if (error) {
    console.error("[v0] Error rejecting inspection:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getExpiringComplianceItems() {
  const supabase = await createClient()

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, vehicle_number')

  const { data: checklists } = await supabase
    .from('vehicle_compliance_checklist')
    .select('*')

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const now = new Date()

  const alerts: any[] = []

  checklists?.forEach((checklist) => {
    const vehicle = vehicles?.find((v) => v.id === checklist.vehicle_id)
    if (!vehicle) return

    const ITEMS_WITH_DATES = [
      { key: 'vehicle_insurance', label: 'Vehicle Insurance' },
      { key: 'vehicle_license', label: 'Vehicle License' },
      { key: 'road_worthiness', label: 'Road Worthiness' },
      { key: 'hackney_permit', label: 'Hackney Permit' },
      { key: 'cdl_license', label: 'CDL License' },
      { key: 'driver_license', label: "Driver's License" },
    ]

    ITEMS_WITH_DATES.forEach((item) => {
      const expiryDate = checklist[`${item.key}_expiry_date`]
      if (expiryDate) {
        const expiry = new Date(expiryDate)
        if (expiry < thirtyDaysFromNow && expiry > now) {
          const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          alerts.push({
            vehicle: vehicle.vehicle_number,
            item: item.label,
            expiryDate: expiry,
            daysUntilExpiry,
          })
        }
      }
    })
  })

  return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
}

export async function getLowStockItems() {
  const supabase = await createClient()

  const { data: parts, error } = await supabase
    .from("inventory_parts")
    .select("name, part_number, current_stock, reorder_level")
    .order("current_stock", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching inventory parts:", error)
    return []
  }

  // Filter in JS to avoid type casting issues with the reorder_level column
  const lowStock = parts.filter((part: any) => part.current_stock <= part.reorder_level)

  return lowStock.map((part: any) => ({
    name: part.name,
    partNumber: part.part_number,
    currentStock: part.current_stock,
    reorderLevel: part.reorder_level,
  }))
}
