
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

async function checkSchema() {
    const { data, error } = await supabase
        .from('driver_spending_transactions')
        .select('*')
        .limit(1)

    if (error) {
        console.error(error)
        return
    }

    if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]))
    } else {
        console.log('No data found, cannot infer columns, but table exists.')
    }
}

checkSchema()
