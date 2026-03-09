import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function test() {
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=email`, {
            headers: {
                'apikey': supabaseKey,
            }
        });
        if (response.ok) {
            const data = await response.json();
            console.log("Emails:", data);
        } else {
            console.log("Error:", await response.text());
        }
    } catch (err) {
        console.error("Fetch failed:", err.message);
    }
}

test();
