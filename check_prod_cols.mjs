import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://kqanordhsmbtcwtjtrme.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYW5vcmRoc21idGN3dGp0cm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2OTY1OSwiZXhwIjoyMDg3ODQ1NjU5fQ.nXLMGiPUEnUjxpETgUGhsXq8lwENUwZjxyTk3m83f58'
);

async function checkCols() {
  console.log("Starting DB query...");
  const { data, error } = await supabaseAdmin
    .from('restaurants')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Error fetching restaurants:", error);
  } else {
    console.log("Columns found in restaurants:", Object.keys(data[0] || {}));
  }
}

checkCols();
