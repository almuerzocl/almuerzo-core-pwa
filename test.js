const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { error, data } = await supabase.auth.signInWithPassword({
    email: 'user5@almuerzo.cl',
    password: 'password123' 
  });
  console.log('SignInError:', error ? error.message : null);
  console.log('Data:', data.user ? data.user.id : null);
}

check();
