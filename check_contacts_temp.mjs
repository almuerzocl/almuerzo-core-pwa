import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/estebanzarate/Documents/Almuerzocl/almuerzo-core-pwa/.env' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('Checking contacts table...');
    const { data: contactsData, error: contactsError } = await supabaseAdmin.from('contacts').select('*').limit(1);
    if (contactsError) {
        console.error('Error fetching contacts:', contactsError.message);
    } else {
        console.log('Contacts table exists!');
        if (contactsData.length > 0) {
            console.log('Contacts columns:', Object.keys(contactsData[0]));
        }
    }
}
run();
