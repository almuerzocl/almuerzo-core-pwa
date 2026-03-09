import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function test() {
    console.log("Checking check_restaurant_availability RPC...");
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/check_restaurant_availability`, {
            method: 'POST',
            headers: {
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ p_restaurant_id: '00000000-0000-0000-0000-000000000000', p_selected_time: new Date().toISOString(), p_party_size: 2 })
        });
        console.log(`Status: ${response.status} ${response.statusText}`);
        if (!response.ok) {
            console.log("Error:", await response.text());
        }
    } catch (err) {
        console.error("Fetch failed:", err.message);
    }
}

test();
