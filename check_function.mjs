import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabaseAdmin.rpc('get_function_definition', { function_name: 'handle_new_user' });
  if (error) {
    console.error('Error fetching function:', error);
    // Try another way - maybe a general RPC to get schema info
  } else {
    console.log('Function Definition:', data);
  }
}

run();
