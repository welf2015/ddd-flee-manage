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

export async function updateClient(clientId: string, data: any) {
  const supabase = await createSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const updateData = {
    name: data.name,
    contact_name: data.contact_name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from("clients").update(updateData).eq("id", clientId)

  if (error) {
    console.error("Error updating client:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/clients")
  return { success: true }
}

export async function deleteClient(clientId: string) {
  const supabase = await createSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Get client data for logging
  const { data: client } = await supabase.from("clients").select("*").eq("id", clientId).single()

  if (!client) {
    return { success: false, error: "Client not found" }
  }

  // Check if client has any bookings
  const { data: bookings } = await supabase.from("bookings").select("id").eq("client_id", clientId).limit(1)

  if (bookings && bookings.length > 0) {
    return {
      success: false,
      error: "Cannot delete client. They have existing bookings. Please delete or reassign bookings first.",
    }
  }

  // Delete the client
  const { error } = await supabase.from("clients").delete().eq("id", clientId)

  if (error) {
    return { success: false, error: `Delete failed: ${error.message}` }
  }

  // Get user profile for logging
  const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).single()

  // Log the action
  await supabase.from("system_activity_log").insert({
    module: "Clients",
    action: "Deleted",
    reference_id: client.name || clientId,
    description: `Deleted client: ${client.name} (${client.contact_name})`,
    user_id: user.id,
    user_name: profile?.full_name || "Unknown",
    user_email: profile?.email || "",
    old_value: JSON.stringify(client),
    new_value: null,
  })

  revalidatePath("/dashboard/clients")
  return { success: true }
}
