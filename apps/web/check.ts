import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data: users } = await supabase.from('profiles').select('id, full_name');
  console.log("Users:", users?.filter(u => u.full_name.includes('test')));

  const { data: docs } = await supabase.from('document_recipients').select('*');
  console.log("Docs:", docs);

  const { data: tasks } = await supabase.from('task_recipients').select('*');
  console.log("Tasks:", tasks);
}

check();
