"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getStaffList() {
  const supabase = await createClient()

  const { data, error } = await supabase.from("staff_directory").select("*").order("full_name", { ascending: true })

  if (error) {
    console.error("Error fetching staff:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function createStaffMember(data: FormData) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  const fullName = data.get("full_name") as string
  const email = data.get("email") as string
  const phone = data.get("phone") as string
  const role = data.get("role") as string
  const department = data.get("department") as string

  const { error } = await supabase.from("staff_directory").insert({
    full_name: fullName,
    email: email || null,
    phone: phone || null,
    role: role || null,
    department: department || null,
    created_by: userData.user?.id,
  })

  if (error) {
    console.error("Error creating staff member:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/settings")
  return { success: true }
}

export async function updateStaffMember(id: string, data: FormData) {
  const supabase = await createClient()

  const fullName = data.get("full_name") as string
  const email = data.get("email") as string
  const phone = data.get("phone") as string
  const role = data.get("role") as string
  const department = data.get("department") as string
  const isActive = data.get("is_active") === "true"

  const { error } = await supabase
    .from("staff_directory")
    .update({
      full_name: fullName,
      email: email || null,
      phone: phone || null,
      role: role || null,
      department: department || null,
      is_active: isActive,
    })
    .eq("id", id)

  if (error) {
    console.error("Error updating staff member:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/settings")
  return { success: true }
}

export async function deleteStaffMember(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("staff_directory").delete().eq("id", id)

  if (error) {
    console.error("Error deleting staff member:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/settings")
  return { success: true }
}
