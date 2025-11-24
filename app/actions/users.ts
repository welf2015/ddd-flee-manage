"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto"
import { SYSTEM_ROLES, type SystemRole } from "@/lib/roles"

const ROLE_CREATION_GUARDS: SystemRole[] = ["MD", "ED", "Head of Operations"]

function generatePassword() {
  return randomBytes(12)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 12)
}

export async function invitePlatformUser(data: { fullName: string; email: string; role: string }) {
  const normalizedEmail = data.email.trim().toLowerCase()
  const requestedRole = data.role as SystemRole

  if (!SYSTEM_ROLES.includes(requestedRole)) {
    return { success: false, error: "Invalid role selected" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: requester } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!requester || !ROLE_CREATION_GUARDS.includes((requester.role || "Staff") as SystemRole)) {
    return { success: false, error: "You do not have permission to create users" }
  }

  const admin = createAdminClient()

  const { data: existingProfile } = await admin.from("profiles").select("id").eq("email", normalizedEmail).maybeSingle()
  if (existingProfile) {
    return { success: false, error: "A profile with this email already exists" }
  }

  const tempPassword = generatePassword()
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password: tempPassword,
    email_confirm: true,
  })

  if (createError || !created?.user) {
    return { success: false, error: createError?.message || "Failed to create auth user" }
  }

  const { error: profileError } = await admin
    .from("profiles")
    .upsert({
      id: created.user.id,
      email: normalizedEmail,
      full_name: data.fullName.trim(),
      role: requestedRole,
    })

  if (profileError) {
    return { success: false, error: profileError.message }
  }

  revalidatePath("/dashboard/settings")
  return { success: true, password: tempPassword }
}

