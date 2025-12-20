
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    const { data, error } = await supabase
        .from("driver_spending_transactions")
        .select("*")
        .limit(1)

    if (error) {
        console.error(error)
        return
    }

    if (data && data.length > 0) {
        console.log('Schema Keys:', Object.keys(data[0]))
    } else {
        console.log('No rows found, cannot infer schema.')
    }
}

run()
