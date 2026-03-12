import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://kqanordhsmbtcwtjtrme.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYW5vcmRoc21idGN3dGp0cm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2OTY1OSwiZXhwIjoyMDg3ODQ1NjU5fQ.nXLMGiPUEnUjxpETgUGhsXq8lwENUwZjxyTk3m83f58'
);

async function check() {
  console.log("Probing if adding user_id to payload works...");
  
  const payload = { 
    restaurant_id: '4b739c39-95cd-40e8-8f39-b1af52478d9a',
    organizer_id: '35d167b4-91d4-4075-9671-5ad852930efd',
    user_id: '35d167b4-91d4-4075-9671-5ad852930efd', // <--- Adding this
    date_time: new Date().toISOString(),
    status: 'PENDIENTE'
  };
  
  const { error } = await supabaseAdmin.from('reservations').insert(payload);
  
  if (error) {
    console.log("Insert with user_id failed:", error.message, "(Code:", error.code, ")");
    if (error.message.includes('column "user_id" of relation "reservations" does not exist')) {
        console.log("The column user_id does NOT exist in the table, but the TRIGGER wants it in NEW record.");
    }
  } else {
    console.log("Insert with user_id WORKED! This means the trigger is happy.");
  }
}

check();
