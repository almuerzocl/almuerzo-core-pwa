import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/estebanzarate/Documents/Almuerzocl/almuerzo-core-pwa/.env' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listAllFunctions() {
    console.log('Listing all functions...');
    // A query for pg_proc should work if it's open or via a workaround 
    // Actually, Supabase has an API for functions but only if you have a special RPC or similar.
    // Let's try to get more table names then.
    
    const { data: tables, error: tablesErr } = await supabaseAdmin
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');
    
    if (tablesErr) {
        console.error('Error listing tables:', tablesErr.message);
    } else {
        console.log('Tables in public schema:', tables.map(t => t.tablename));
    }
}

listAllFunctions();
