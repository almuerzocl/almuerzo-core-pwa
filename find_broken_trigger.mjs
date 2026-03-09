import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://kqanordhsmbtcwtjtrme.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYW5vcmRoc21idGN3dGp0cm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2OTY1OSwiZXhwIjoyMDg3ODQ1NjU5fQ.nXLMGiPUEnUjxpETgUGhsXq8lwENUwZjxyTk3m83f58'
);

async function findBrokenTrigger() {
    const query = `
        SELECT 
            proname AS function_name,
            prosrc AS source_code
        FROM pg_proc
        JOIN pg_namespace n ON n.oid = pronamespace
        WHERE nspname = 'public'
        AND prosrc ILIKE '%approved_at%'
    `;
    
    // Attempting to run this via exec_sql if it exists, or just query pg_proc if allowed via select (not usually allowed for pg_proc)
    try {
        const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: query });
        if (error) {
            console.error("RPC Error:", error);
            // Fallback: list triggers and their functions
            const query2 = `
                SELECT 
                    tgname AS trigger_name,
                    relname AS table_name,
                    proname AS function_name
                FROM pg_trigger
                JOIN pg_class ON pg_class.oid = tgrelid
                JOIN pg_proc ON pg_proc.oid = tgfoid
                WHERE relname IN ('takeaway_orders', 'reservations')
            `;
            const { data: data2, error: error2 } = await supabaseAdmin.rpc('exec_sql', { sql: query2 });
            console.log("Triggers on tables:", data2);
        } else {
            console.log("Functions with approved_at:", data);
        }
    } catch (err) {
        console.error("Catch Error:", err);
    }
}

findBrokenTrigger();
