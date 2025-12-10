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

  // Check if vendor is used in any procurements
  const { data: procurements } = await supabase
    .from("procurements")
    .select("id")
    .eq("vendor_id", vendorId)
    .limit(1)

  if (procurements && procurements.length > 0) {
    return { success: false, error: "Cannot delete vendor that is used in procurements" }
  }

  const { error } = await supabase.from("vendors").delete().eq("id", vendorId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/procurement")
  return { success: true }
}
