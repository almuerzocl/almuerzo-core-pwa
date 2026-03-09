import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://kqanordhsmbtcwtjtrme.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYW5vcmRoc21idGN3dGp0cm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2OTY1OSwiZXhwIjoyMDg3ODQ1NjU5fQ.nXLMGiPUEnUjxpETgUGhsXq8lwENUwZjxyTk3m83f58'
);

async function checkCols() {
  console.log("Checking columns for reservations table...");
  const { data, error } = await supabaseAdmin.from('reservations').select('*').limit(1);
  
  if (error) {
    console.error("Error fetching reservations:", error);
    if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log("Detected missing column in select * (unlikely but possible if internal error)");
    }
  } else if (data && data.length > 0) {
    console.log("Columns found:", Object.keys(data[0]));
  } else {
    // If no data, we can't see columns via select *. Let's try to insert a dummy (or use a different trick)
    console.log("Table is empty. Trying to list columns via rpc if we had one, or a known hack.");
    // Supabase REST doesn't have an easy "describe table".
  }
}

checkCols();
