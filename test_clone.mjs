import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://kqanordhsmbtcwtjtrme.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYW5vcmRoc21idGN3dGp0cm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2OTY1OSwiZXhwIjoyMDg3ODQ1NjU5fQ.nXLMGiPUEnUjxpETgUGhsXq8lwENUwZjxyTk3m83f58'
);

async function clone() {
  const { data } = await supabaseAdmin.from('takeaway_orders').select('*').limit(1);
  if (!data || data.length === 0) return;
  
  const original = data[0];
  const copy = { ...original };
  delete copy.id;
  delete copy.created_at;
  delete copy.updated_at;
  
  console.log("Attempting to insert exact copy (minus id/timestamps)...");
  const { error } = await supabaseAdmin.from('takeaway_orders').insert(copy);
  if (error) {
    console.log("Darn, copy failed too:", error.message);
  } else {
    console.log("Copy worked! So what was different?");
  }
}

clone();
