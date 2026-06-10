import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './apps/web/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTasks() {
  const { data, error } = await supabase.from('tasks').select('*').limit(1);
  if (error) {
    console.log("Select error:", error);
  } else if (data && data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
    console.log("Sample Data:", data[0]);
  } else {
    // If empty, try to get columns by creating a deliberate error or inserting a fake record and rolling back?
    // Alternative: check information_schema using rpc if available, or just fetch via REST with headers.
    console.log("No data in tasks table.");
  }
}

checkTasks();
