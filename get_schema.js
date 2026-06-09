import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './apps/web/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCols() {
  const { data, error } = await supabase.from('meetings').select('*').limit(1);
  if (error) {
    console.log("Select error:", error);
  } else if (data && data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
  } else {
    console.log("Still no data?");
  }
}

checkCols();
