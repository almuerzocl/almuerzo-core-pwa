
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kqanordhsmbtcwtjtrme.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYW5vcmRoc21idGN3dGp0cm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2OTY1OSwiZXhwIjoyMDg3ODQ1NjU5fQ.nXLMGiPUEnUjxpETgUGhsXq8lwENUwZjxyTk3m83f58'

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    console.log("--- Checking Profiles Table ---")
    
    // Check if we can find any profile
    const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, favorite_restaurant_ids, subscribed_daily_menu_ids')
        .limit(5);

    if (profError) {
        console.error("Error fetching profiles:", profError)
    } else {
        console.log("Sample Profiles:", JSON.stringify(profiles, null, 2))
    }

    // Try to update a profile (using service role, it should work regardless of RLS)
    // but the point is to see if the columns exist and are arrays
    if (profiles && profiles.length > 0) {
        const testProfile = profiles[0];
        console.log("\nAttempting test update on profile:", testProfile.id);
        
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
                favorite_restaurant_ids: [...(testProfile.favorite_restaurant_ids || []), 'test-restaurant-id'] 
            })
            .eq('id', testProfile.id);

        if (updateError) {
            console.error("Update failed:", updateError)
        } else {
            console.log("Update SUCCESSFUL!");
            
            // Revert
             await supabase
                .from('profiles')
                .update({ 
                    favorite_restaurant_ids: testProfile.favorite_restaurant_ids || [] 
                })
                .eq('id', testProfile.id);
        }
    }
}

check()
