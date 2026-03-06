import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabaseAdmin.rpc('get_trigger_info');
  console.log('We may not have this RPC. Lets try to execute raw sql directly if possible.');
  
  // Actually, we can just use the generic Supabase REST API to check if the trigger causes errors
  const email = `trigger_test_${Date.now()}@example.com`;
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: 'password123',
    email_confirm: true
  });
  
  if (authError) {
    console.error('Trigger error may be preventing auth:', authError);
  } else {
    console.log('User created:', authData.user.id);
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
  }
}

run();
