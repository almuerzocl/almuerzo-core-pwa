import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://kqanordhsmbtcwtjtrme.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYW5vcmRoc21idGN3dGp0cm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2OTY1OSwiZXhwIjoyMDg3ODQ1NjU5fQ.nXLMGiPUEnUjxpETgUGhsXq8lwENUwZjxyTk3m83f58'
);

async function checkTriggers() {
  console.log("Checking triggers on takeaway_orders and reservations...");
  const { data, error } = await supabaseAdmin.rpc('get_triggers_and_functions');

  if (error) {
    // Try raw query
    const { data: raw, error: rawError } = await supabaseAdmin.from('pg_trigger').select('tgname, tgrelid::regclass').filter('tgrelid::regclass::text', 'in', '("takeaway_orders", "reservations")');
    console.log("Raw triggers:", raw);
  } else {
    console.log("Triggers:", data);
  }
}

async function listAllTriggers() {
    const { data, error } = await supabaseAdmin.from('pg_trigger').select(`
        tgname,
        relname:tgrelid(relname)
    `).limit(50);
    console.log("All triggers:", data);
}

// Better way to check triggers via SQL if possible
async function checkTriggerQuery() {
    const query = `
        SELECT 
            event_object_table AS table_name,
            trigger_name,
            event_manipulation AS event,
            action_statement AS action,
            action_timing AS timing
        FROM information_schema.triggers
        WHERE event_object_table IN ('takeaway_orders', 'reservations')
    `;
    // We can't run raw SQL directly without an RPC, let's see if we have one
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: query });
    if (error) {
        console.error("Exec SQL error:", error);
    } else {
        console.log("Triggers info:", data);
    }
}

checkTriggerQuery();
