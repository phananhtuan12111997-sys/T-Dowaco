import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data: policies } = await supabaseAdmin.from('document_recipients').select('*').limit(1);
  console.log("Can read admin:", policies?.length);
  
  // Can we get the RLS policies? 
  // Let's just query pg_policies
  const { data: p, error } = await supabaseAdmin.rpc('get_policies', {})
  if (error) {
    const { data: p2 } = await supabaseAdmin.from('pg_policies').select('*').eq('tablename', 'document_recipients');
    console.log("Policies:", p2);
  }
}

check();
