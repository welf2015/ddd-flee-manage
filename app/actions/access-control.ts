"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

const ACCESS_CONTROL_ROLES = ["MD", "ED", "Head of Operations"]

async function assertAccessControlPermission(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<{ allowed: boolean; error?: string }> {
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single()

  if (!profile || !ACCESS_CONTROL_ROLES.includes(profile.role || "Staff")) {
    return { allowed: false, error: "Insufficient permissions" }
  }

  return { allowed: true }
}

export async function getPagePermissions() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: pages, error } = await supabase.from("page_permissions").select("*").order("page_name")

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: pages }
}

export async function getRolePermissions(role: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: permissions, error } = await supabase
    .from("role_permissions")
    .select(`
      *,
      page:page_permissions(*)
    `)
    .eq("role", role)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: permissions }
}

export async function getAllUsers() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: users, error } = await supabase.from("profiles").select("*").order("full_name")

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: users }
}

export async function updateRolePermission(rolePermissionId: string, canAccess: boolean) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const guard = await assertAccessControlPermission(supabase, user.id)
  if (!guard.allowed) {
    return { success: false, error: guard.error }
  }

  const { error } = await supabase.from("role_permissions").update({ can_access: canAccess }).eq("id", rolePermissionId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/settings")
  return { success: true }
}

export async function createRolePermission(role: string, pageId: string, canAccess: boolean) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const guard = await assertAccessControlPermission(supabase, user.id)
  if (!guard.allowed) {
    return { success: false, error: guard.error }
  }

  const { data, error } = await supabase
    .from("role_permissions")
    .insert({
      role,
      page_id: pageId,
      can_access: canAccess,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/settings")
  return { success: true, data }
}

export async function updateUserRole(userId: string, newRole: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const guard = await assertAccessControlPermission(supabase, user.id)
  if (!guard.allowed) {
    return { success: false, error: guard.error }
  }

  const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/settings")
  return { success: true }
}
