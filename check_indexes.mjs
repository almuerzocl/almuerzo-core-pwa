import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://kqanordhsmbtcwtjtrme.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYW5vcmRoc21idGN3dGp0cm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2OTY1OSwiZXhwIjoyMDg3ODQ1NjU5fQ.nXLMGiPUEnUjxpETgUGhsXq8lwENUwZjxyTk3m83f58'
);

async function checkIndexes() {
  console.log("Checking indexes on restaurants...");
  const { data, error } = await supabaseAdmin.rpc('get_table_indexes', { table_name: 'restaurants' });

  if (error) {
    // If the rpc doesn't exist, we can try a direct sql check if we had a way, but let's just query pg_indexes
    console.log("RPC get_table_indexes failed. Trying raw query via select...");
    const { data: indexes, error: idxError } = await supabaseAdmin.from('pg_indexes').select('*').eq('tablename', 'restaurants');
    if (idxError) {
        console.error("Could not fetch indexes:", idxError);
        console.log("Tip: If you cannot check indexes, assume they are missing and add them.");
    } else {
        console.log("Indexes:", indexes);
    }
  } else {
    console.log("Indexes found:", data);
  }
}

checkIndexes();
