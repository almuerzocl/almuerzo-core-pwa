import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const email = `test_admin_user_${Date.now()}@test.com`;
  const first_name = 'Test';
  const last_name = 'Admin';
  const dbRole = 'admin'; // Testing restaurant role mapping
  const restaurant_id = '4b739c39-95cd-40e8-8f39-b1af52478d9a'; // Using an existing one found earlier
  
  console.log(`Creating user ${email}`);

  // 1. Auth create
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'password123',
      email_confirm: true,
      user_metadata: {
          first_name,
          last_name,
      },
  });

  if (authError) {
      console.log('Auth Error:', authError.message);
      return;
  }

  const user = authData.user;
  console.log('Auth success. User ID:', user.id);

  // 2. Profile upsert
  const profilePayload = {
      id: user.id,
      email,
      first_name,
      last_name,
      role: dbRole,
      restaurant_id
  };

  console.log('Upserting to profiles:', profilePayload);

  const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profilePayload);

  if (profileError) {
      console.log('Profile Upsert Error:', profileError);
      
      console.log('Reverting auth user...');
      await supabaseAdmin.auth.admin.deleteUser(user.id);
  } else {
      console.log('Profile created successfully.');
      
      // Try to log in as this user
      const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      const { data: sessionData, error: sessionError } = await anonClient.auth.signInWithPassword({
        email,
        password: 'password123'
      });
      
      if (sessionError) {
        console.log('Login error:', sessionError);
      } else {
        console.log('Login successful! Access token:', sessionData.session.access_token.substring(0, 20) + '...');
      }

      console.log('Cleaning up...');
      await supabaseAdmin.auth.admin.deleteUser(user.id);
  }
}

run();
