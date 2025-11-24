import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"

const USERS = [
  "munnir.r@voltaamobility.com",
  "naomi.d@voltaamobility.com",
  "elohoe.e@voltaamobility.com",
  "accountant@voltaamobility.com",
]

const generatePassword = () =>
  randomBytes(12)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 12)

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
  process.exit(1)
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function resetPassword(email) {
  const { data } = await admin.auth.admin.listUsers({ email })
  const user = data?.users?.[0]

  if (!user) {
    console.warn(`[skip] No auth user found for ${email}`)
    return null
  }

  const password = generatePassword()
  await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true })
  return { email, password }
}

async function main() {
  const results = []
  for (const email of USERS) {
    try {
      const result = await resetPassword(email)
      if (result) {
        results.push(result)
        console.log(`[password-reset] ${result.email} :: ${result.password}`)
      }
    } catch (error) {
      console.error(`[error] Failed to reset password for ${email}:`, error.message)
    }
  }

  if (results.length === 0) {
    console.log("No passwords were updated.")
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

