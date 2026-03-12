
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kqanordhsmbtcwtjtrme.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYW5vcmRoc21idGN3dGp0cm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2OTY1OSwiZXhwIjoyMDg3ODQ1NjU5fQ.nXLMGiPUEnUjxpETgUGhsXq8lwENUwZjxyTk3m83f58'

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    console.log("--- Checking Profiles Table ---")
    const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, role')
        .limit(10);

    if (profError) {
        console.error("Error fetching profiles:", profError)
    } else {
        console.log("Profiles Roles:", JSON.stringify(profiles, null, 2))
    }
}

check()
