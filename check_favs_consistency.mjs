
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kqanordhsmbtcwtjtrme.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYW5vcmRoc21idGN3dGp0cm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2OTY1OSwiZXhwIjoyMDg3ODQ1NjU5fQ.nXLMGiPUEnUjxpETgUGhsXq8lwENUwZjxyTk3m83f58'

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    console.log("--- Checking Favorites Consistency ---")
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, favorite_restaurant_ids')
        .not('favorite_restaurant_ids', 'eq', '{}');

    if (error) {
        console.error(error)
    } else {
        console.log(`Found ${profiles.length} users with favorites.`)
        profiles.forEach(p => {
            console.log(`User ${p.id}: ${p.favorite_restaurant_ids.length} favs`)
        })
    }
}

check()
