import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // Get user profile to determine role
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

    return NextResponse.json({
      user: data.user,
      session: data.session,
      profile: profile,
      role: profile?.role || "Staff",
    })
  } catch (error) {
    console.error("[v0] Mobile login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
