"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function deleteVendor(vendorId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // First, unassign vendor from any procurements
  const { error: unassignError } = await supabase
    .from("procurements")
    .update({ vendor_id: null })
    .eq("vendor_id", vendorId)

  if (unassignError) {
    return { success: false, error: `Failed to unassign vendor: ${unassignError.message}` }
  }

  // Now delete the vendor
  const { error } = await supabase.from("vendors").delete().eq("id", vendorId)

  if (error) {
    return { success: false, error: `Delete failed: ${error.message}` }
  }

  revalidatePath("/dashboard/procurement")
  return { success: true }
}
