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

  // First, unassign agent from any procurements
  const { error: unassignError } = await supabase
    .from("procurements")
    .update({ clearing_agent_id: null })
    .eq("clearing_agent_id", agentId)

  if (unassignError) {
    return { success: false, error: `Failed to unassign clearing agent: ${unassignError.message}` }
  }

  // Now delete the clearing agent
  const { error } = await supabase.from("clearing_agents").delete().eq("id", agentId)

  if (error) {
    return { success: false, error: `Delete failed: ${error.message}` }
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
