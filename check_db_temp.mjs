
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kqanordhsmbtcwtjtrme.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYW5vcmRoc21idGN3dGp0cm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2OTY1OSwiZXhwIjoyMDg3ODQ1NjU5fQ.nXLMGiPUEnUjxpETgUGhsXq8lwENUwZjxyTk3m83f58'

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    console.log("--- Checking Reservations ---")
    const { data: res, error: resError } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    if (resError) console.error("Error res:", resError)
    else console.log("Recent Reservations:", JSON.stringify(res, null, 2))

    console.log("\n--- Checking Orders ---")
    const { data: ord, error: ordError } = await supabase
        .from('takeaway_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    if (ordError) console.error("Error ord:", ordError)
    else console.log("Recent Orders:", JSON.stringify(ord, null, 2))
}

check()
