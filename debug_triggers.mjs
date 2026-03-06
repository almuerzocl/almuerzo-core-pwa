import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log("Checking for triggers and functions...");

    // Attempt to discover triggers via information_schema (if possible through select)
    // Note: Standard Supabase API might not allow this unless there's an RPC or it's a superuser key
    // But since we use service_role, we might have luck if the table is exposed or via a generic RPC

    const { data: triggers, error: tErr } = await supabaseAdmin
        .from('pg_trigger')
        .select('*')
        .limit(1);

    if (tErr) {
        console.log("Cannot access pg_trigger directly via Postgrest (expected).");
    } else {
        console.log("Found triggers:", triggers);
    }

    // Checking if a user creation fails with a specific error
    const testEmail = `debug_fail_${Date.now()}@example.com`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: 'Password123!',
        email_confirm: true
    });

    if (authError) {
        console.error("Auth creation error:", authError);
    } else {
        console.log("Auth user created:", authData.user.id);
        const { data: profile, error: pErr } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

        if (profile) {
            console.log("Profile was AUTO-CREATED by trigger:", profile);
        } else {
            console.log("No profile auto-created.");
        }

        // Clean up
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    }
}

run();
