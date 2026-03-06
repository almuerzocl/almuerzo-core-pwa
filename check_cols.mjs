import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
const { data, error } = await supabaseAdmin.from('reservations').select('*').limit(1);
if (data && data.length > 0) {
    console.log('Reservations columns:', Object.keys(data[0]));
} else {
    console.log('Reservations empty or error:', error);
}

const { data: d2, error: e2 } = await supabaseAdmin.from('takeaway_orders').select('*').limit(1);
if (d2 && d2.length > 0) {
    console.log('Takeaway orders columns:', Object.keys(d2[0]));
} else {
    console.log('Takeaway orders empty or error:', e2);
}
}
run();
