import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"

const REQUIRED_ENV = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
const missing = REQUIRED_ENV.filter((key) => !process.env[key])

if (missing.length) {
  console.error("Missing required environment variables:", missing.join(", "))
  process.exit(1)
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const USERS = [
  { fullName: "Munnir R", email: "munnir.r@voltaamobility.com", role: "MD" },
  { fullName: "Naomi D", email: "naomi.d@voltaamobility.com", role: "ED" },
  { fullName: "Elohoe E", email: "elohoe.e@voltaamobility.com", role: "Operations and Fleet Officer" },
  {
    fullName: "Volta Accountant",
    email: "accountant@voltaamobility.com",
    role: "Accountant",
  },
]

const generatePassword = () =>
  randomBytes(12)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 12)

async function ensureUser(user) {
  const { data: existing } = await admin.from("profiles").select("id").eq("email", user.email).maybeSingle()
  if (existing) {
    console.log(`[skip] ${user.email} already provisioned`)
    return null
  }

  let authUser = null
  try {
    const { data: listed } = await admin.auth.admin.listUsers({ email: user.email })
    authUser = listed?.users?.[0] || null
  } catch {
    authUser = null
  }

  let password = null
  if (!authUser) {
    password = generatePassword()
    const { data, error } = await admin.auth.admin.createUser({
      email: user.email,
      password,
      email_confirm: true,
    })

    if (error) {
      throw new Error(`Failed to create auth user for ${user.email}: ${error.message}`)
    }
    authUser = data.user
  }

  const { error: profileError } = await admin
    .from("profiles")
    .upsert({
      id: authUser.id,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
    })

  if (profileError) {
    if (profileError.message?.includes("profiles_role_check")) {
      console.error(
        `[blocked] ${user.email} could not be assigned role "${user.role}" because the database constraint has not been updated.`,
      )
      return null
    }
    throw new Error(`Failed to insert profile for ${user.email}: ${profileError.message}`)
  }

  if (password) {
    console.log(`[created] ${user.email} :: ${password}`)
    return { email: user.email, password }
  }

  console.log(`[linked] ${user.email} already existed in auth; profile updated.`)
  return null
}

async function main() {
  const created = []
  for (const user of USERS) {
    const result = await ensureUser(user)
    if (result) {
      created.push(result)
    }
  }

  if (created.length === 0) {
    console.log("All requested users already exist.")
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
