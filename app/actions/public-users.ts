"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { SYSTEM_ROLES, type SystemRole } from "@/lib/roles"

type CreateUserInput = {
  fullName: string
  email: string
  role: string
  password: string
}

const MIN_PASSWORD_LENGTH = 8

export async function createUserFromLogin(data: CreateUserInput) {
  const admin = createAdminClient()
  const email = data.email.trim().toLowerCase()

  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid email address." }
  }

  if (data.fullName.trim().length < 2) {
    return { success: false, error: "Full name must be at least 2 characters." }
  }

  if (!SYSTEM_ROLES.includes(data.role as SystemRole)) {
    return { success: false, error: "Invalid role selected." }
  }

  if (data.password.length < MIN_PASSWORD_LENGTH) {
    return { success: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }
  }

  let authUserId: string | null = null

  try {
    const { data: existing } = await admin.auth.admin.listUsers({ email })
    const existingUser = existing?.users?.[0]

    if (existingUser) {
      authUserId = existingUser.id
      await admin.auth.admin.updateUserById(existingUser.id, {
        password: data.password,
        email_confirm: true,
      })
    } else {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: data.password,
        email_confirm: true,
      })

      if (createError || !created?.user) {
        throw createError || new Error("Failed to create auth user")
      }

      authUserId = created.user.id
    }

    if (!authUserId) {
      throw new Error("Unable to determine user ID")
    }

    const { error: profileError } = await admin
      .from("profiles")
      .upsert({
        id: authUserId,
        email,
        full_name: data.fullName.trim(),
        role: data.role as SystemRole,
      })
      .eq("id", authUserId)

    if (profileError) {
      if (profileError.message?.includes("profiles_role_check")) {
        throw new Error("Database is not configured to accept this role. Please run the role migration.")
      }

      throw profileError
    }

    return { success: true }
  } catch (error: any) {
    console.error("[createUserFromLogin] error", error)
    return { success: false, error: error?.message || "Failed to create user" }
  }
}

