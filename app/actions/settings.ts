"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getFuelRate() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", "fuel_rate_per_liter")
    .single()

  if (error || !data) {
    return { success: false, rate: 1019 } // Default rate
  }

  return { success: true, rate: data.setting_value.amount }
}

export async function updateFuelRate(rate: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const { data: existing } = await supabase
    .from("system_settings")
    .select("id")
    .eq("setting_key", "fuel_rate_per_liter")
    .single()

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from("system_settings")
      .update({
        setting_value: { amount: rate, currency: "NGN" },
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("setting_key", "fuel_rate_per_liter")

    if (error) {
      return { success: false, error: error.message }
    }
  } else {
    // Insert new record
    const { error } = await supabase.from("system_settings").insert({
      setting_key: "fuel_rate_per_liter",
      setting_value: { amount: rate, currency: "NGN" },
      updated_by: user.id,
    })

    if (error) {
      return { success: false, error: error.message }
    }
  }

  revalidatePath("/dashboard/expenses")
  return { success: true }
}
