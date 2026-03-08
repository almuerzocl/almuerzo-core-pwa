import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/estebanzarate/Documents/Almuerzocl/almuerzo-core-pwa/.env' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRPC() {
    console.log('Checking get_my_available_discounts RPC...');
    // We need a restaurant ID. Let's try to find one first.
    const { data: res } = await supabaseAdmin.from('restaurants').select('id').limit(1);
    if (!res || res.length === 0) {
        console.log('No restaurants found.');
        return;
    }
    const restaurantId = res[0].id;
    const date = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabaseAdmin.rpc('get_my_available_discounts', {
        p_restaurant_id: restaurantId,
        p_service_type: 'reservation',
        p_date: date
    });

    if (error) {
        console.error('RPC Error:', error.message);
    } else {
        console.log('RPC Response:', data);
    }
}

checkRPC();
