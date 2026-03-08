import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/estebanzarate/Documents/Almuerzocl/almuerzo-core-pwa/.env' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('Checking if exec_sql rpc exists...');
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: 'SELECT 1;' });
    if (error) {
        console.error('exec_sql RPC not found or failed:', error.message);
    } else {
        console.log('exec_sql RPC exists! Running migration...');
        const fs = await import('fs');
        const sql = fs.readFileSync('/Users/estebanzarate/Documents/Almuerzocl/almuerzo-core-pwa/v5_schema_patch.sql', 'utf8');
        const { error: patchError } = await supabaseAdmin.rpc('exec_sql', { sql });
        if (patchError) {
             console.error('Patch failed:', patchError.message);
        } else {
             console.log('Patch applied successfully!');
        }
    }
}
run();
