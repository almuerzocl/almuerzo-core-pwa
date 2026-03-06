import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
const { data, error } = await supabase.auth.signUp({
    email: 'test_register_pwa2@almuerzo.cl',
    password: 'password123'
});
console.log('SignUpError:', error ? error.message : null);
console.log('Data:', data.user ? data.user.id : null);
if(data.user) {
    const { data: profile, error: err } = await supabase.from('profiles').upsert({
        id: data.user.id,
        email: 'test_register_pwa2@almuerzo.cl',
        role: "user",
        account_tier: "basic",
        is_active: true
    });
    console.log('Profileupsert:', err ? err.message : 'success');
}
}
run();
