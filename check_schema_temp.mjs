import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/estebanzarate/Documents/Almuerzocl/almuerzo-core-pwa/.env' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('Checking reservations table...');
    // A trick to see columns: insert an empty record and look at the keys if it succeeded or error if we're wrong, BUT
    // Supabase has schema-aware clients. Let's just try to select 1 row.
    const { data, error } = await supabaseAdmin.from('reservations').select('*').limit(1);
    if (data && data.length > 0) {
        console.log('Reservations columns from existing row:', Object.keys(data[0]));
    } else if (error) {
        console.error('Error selecting from reservations:', error.message);
    } else {
        console.log('Reservations table is empty.');
    }
}

async function testGuestIds() {
    console.log('Testing guest_ids column...');
    const { error } = await supabaseAdmin.from('reservations').insert({ guest_ids: [] });
    if (error) {
        console.log('Guest IDs test error:', error.message);
    } else {
        console.log('Guest IDs column exists!');
    }
}

run();
testGuestIds();
