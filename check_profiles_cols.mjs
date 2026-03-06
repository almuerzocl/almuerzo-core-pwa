import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data, error } = await supabaseAdmin.from('profiles').select('*').limit(1);
    if (data && data.length > 0) {
        console.log('Profiles columns:', Object.keys(data[0]));
    } else {
        console.log('Profiles empty or error:', error);
    }
}
run();
