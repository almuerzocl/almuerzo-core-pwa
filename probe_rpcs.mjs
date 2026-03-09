import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://kqanordhsmbtcwtjtrme.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYW5vcmRoc21idGN3dGp0cm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2OTY1OSwiZXhwIjoyMDg3ODQ1NjU5fQ.nXLMGiPUEnUjxpETgUGhsXq8lwENUwZjxyTk3m83f58'
);

async function probe() {
  const rpcs = ['exec_sql', 'run_sql', 'execute_sql', 'sql', 'query', 'pg_exec'];
  for (const rpc of rpcs) {
    console.log(`Probing RPC: ${rpc}`);
    const { error } = await supabaseAdmin.rpc(rpc, { sql: 'SELECT 1;', query: 'SELECT 1;' });
    if (error && error.message.includes('Could not find the function')) {
      continue;
    }
    console.log(`RPC ${rpc} might exist! Error:`, error);
  }
}

probe();
