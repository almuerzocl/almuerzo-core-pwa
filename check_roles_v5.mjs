import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRoles() {
    const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .limit(100);
    
    if (error) {
        console.error("Error:", error);
        return;
    }

    const roles = [...new Set(data.map(p => p.role))];
    console.log("Distinct roles in DB:", roles);
    
    // Count per role
    const counts = data.reduce((acc, p) => {
        acc[p.role] = (acc[p.role] || 0) + 1;
        return acc;
    }, {});
    console.log("Role counts:", counts);
}

checkRoles();
