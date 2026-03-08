import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/estebanzarate/Documents/Almuerzocl/almuerzo-core-pwa/.env' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRestaurantCols() {
    const { data } = await supabaseAdmin.from('restaurants').select('*').limit(1);
    if (data && data.length > 0) {
        console.log('Restaurant columns:', Object.keys(data[0]));
    }
}

checkRestaurantCols();
