import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // Querying information_schema to get public tables
  const { data, error } = await supabaseAdmin
    .from('profiles') // Just to check if we can reach the DB
    .select('id')
    .limit(1);

  if (error) {
    console.error('Error connecting to DB:', error);
    return;
  }

  // Use raw SQL via an RPC or try to guess. 
  // Since I don't know the RPCs, I'll try to check if user_profiles exists by selecting from it.
  const { error: errorUP } = await supabaseAdmin.from('user_profiles').select('id').limit(1);
  const { data: dataP, error: errorP } = await supabaseAdmin.from('profiles').select('id').limit(1);

  console.log('user_profiles exists?', !errorUP || errorUP.code !== 'PGRST204');
  if (errorUP) console.log('user_profiles error code:', errorUP.code, errorUP.message);
  
  console.log('profiles exists?', !errorP || errorP.code !== 'PGRST204');
  if (errorP) console.log('profiles error code:', errorP.code, errorP.message);

  // Let's try to get all column names for profiles
  const { data: profData, error: profErr } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .limit(1);
    
  if (profData && profData.length > 0) {
    console.log('Profiles columns:', Object.keys(profData[0]));
  }
}

run();
