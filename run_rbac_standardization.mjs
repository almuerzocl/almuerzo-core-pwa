import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runSql() {
  const sqlFile = 'v5_rbac_standardization.sql';
  if (!fs.existsSync(sqlFile)) {
    console.error(`File ${sqlFile} not found.`);
    return;
  }
  
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  // We can try to send the whole script if the RPC handles it, 
  // but it's safer to send it line by line if it doesn't.
  // Given previous run_patch structure, we'll try to split.
  
  const commands = sql.split(';').map(c => c.trim()).filter(c => c.length > 0);
  
  for (const cmd of commands) {
    if (cmd.startsWith('--') || cmd.startsWith('BEGIN') || cmd.startsWith('COMMIT')) continue;
    console.log(`Executing: ${cmd.substring(0, 100)}...`);
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: cmd });
    if (error) {
        console.error(`Error executing: ${error.message}`);
    } else {
        console.log("Success");
    }
  }
}

runSql();
