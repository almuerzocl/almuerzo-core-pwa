import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://kqanordhsmbtcwtjtrme.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYW5vcmRoc21idGN3dGp0cm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2OTY1OSwiZXhwIjoyMDg3ODQ1NjU5fQ.nXLMGiPUEnUjxpETgUGhsXq8lwENUwZjxyTk3m83f58'
);

async function probe() {
  console.log("Probing takeaway_orders status constraint...");
  const statuses = ['PENDIENTE', 'CONFIRMADA', 'CREATED', 'NEW', 'active', 'OPEN', 'PENDING', 'PROCESANDO', 'RECIBIDO', 'SOLICITADO'];
  for (const s of statuses) {
    console.log(`Trying status: ${s}`);
    const { error } = await supabaseAdmin.from('takeaway_orders').insert({
        user_id: '35d167b4-91d4-4075-9671-5ad852930efd', 
        restaurant_id: '2729b647-33c8-4419-8967-f668ec3ce61d',
        items: [{ name: 'Test', price: 1000, quantity: 1 }],
        total_amount: 1000,
        customer_name: 'Test Agent',
        customer_phone: '+123',
        status: s
    });
    if (error) {
        console.log(`Failed with: ${error.message}`);
    } else {
        console.log(`SUCCESS with status: ${s}`);
        // Clean up
        await supabaseAdmin.from('takeaway_orders').delete().eq('status', s);
        break;
    }
  }
}

probe();
