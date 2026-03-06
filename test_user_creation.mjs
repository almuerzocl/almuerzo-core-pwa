import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // We can't run arbitrary SQL easily without an RPC, but let's try to see if we have a "exec_sql" or similar RPC.
  // If not, we'll try to infer from the error message of creating a user.
  
  const testEmail = `test_user_${Date.now()}@example.com`;
  console.log(`Attempting to create test user: ${testEmail}`);
  
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: 'password123',
    email_confirm: true,
    user_metadata: { first_name: 'Test', last_name: 'User', role: 'user' }
  });

  if (error) {
    console.error('Error creating user via Auth:', error);
  } else {
    console.log('User created successfully in Auth:', data.user.id);
    // Now check if a profile was created automatically (by a trigger)
    const { data: profile, error: profError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();
      
    if (profile) {
      console.log('Profile was created AUTOMATICALLY in profiles table:', profile);
    } else {
      console.log('No profile found in profiles table for the new user.');
    }

    // Clean up
    await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    console.log('Test user cleaned up.');
  }
}

run();
