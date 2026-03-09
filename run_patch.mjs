import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseAdmin = createClient(
  'https://kqanordhsmbtcwtjtrme.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYW5vcmRoc21idGN3dGp0cm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2OTY1OSwiZXhwIjoyMDg3ODQ1NjU5fQ.nXLMGiPUEnUjxpETgUGhsXq8lwENUwZjxyTk3m83f58'
);

async function runSql() {
  const sql = fs.readFileSync('fix_triggers_and_schema.sql', 'utf8');
  
  // Splitting into individual commands because simple RPC might struggle with multi-line blocks
  const commands = sql.split(';').map(c => c.trim()).filter(c => c.length > 0);
  
  for (const cmd of commands) {
    if (cmd.startsWith('--')) continue;
    console.log(`Executing: ${cmd.substring(0, 50)}...`);
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: cmd });
    if (error) {
        console.error(`Error: ${error.message}`);
        // If exec_sql doesn't work, we are stuck unless we have a different way.
        // But maybe we can try to use standard queries for some parts?
    } else {
        console.log("Success");
    }
  }
}

runSql();
