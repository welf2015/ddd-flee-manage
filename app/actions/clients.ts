"use server"

import { createClient as createSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createClient(formData: FormData) {
  console.log("[v0] createClient action called")

  const supabase = await createSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] User:", user?.id)

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const client = {
    name: formData.get("name") as string,
    contact_name: formData.get("contact_name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    address: formData.get("address") as string,
  }

  console.log("[v0] Client data:", client)

  const { data, error } = await supabase.from("clients").insert(client).select()

  if (error) {
    console.error("[v0] Error creating client:", error)
    return { success: false, error: error.message }
  }

  console.log("[v0] Client created successfully:", data)
  revalidatePath("/dashboard/clients")
  return { success: true }
}
