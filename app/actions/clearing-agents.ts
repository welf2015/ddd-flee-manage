"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function deleteClearingAgent(agentId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Check if agent is used in any procurements
  const { data: procurements } = await supabase
    .from("procurements")
    .select("id")
    .eq("clearing_agent_id", agentId)
    .limit(1)

  if (procurements && procurements.length > 0) {
    return { success: false, error: "Cannot delete clearing agent that is assigned to procurements" }
  }

  const { error } = await supabase.from("clearing_agents").delete().eq("id", agentId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/procurement")
  return { success: true }
}

export async function updateClearingAgent(
  agentId: string,
  data: {
    name?: string
    contact_name?: string
    email?: string
    phone?: string
    address?: string
    license_number?: string
  },
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase.from("clearing_agents").update(data).eq("id", agentId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/procurement")
  return { success: true }
}
