import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
    console.log("Checking profiles table...");
    const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
    
    if (error) {
        console.error("Error accessing profiles:", error);
    } else {
        console.log("Profiles table accessible. Total rows:", count);
    }
}

checkProfiles();
