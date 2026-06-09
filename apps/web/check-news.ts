import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({path: '.env.local'});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkNews() {
  const { data, error } = await supabase.from('news').select('id, title').eq('id', '9d136985-2e6e-4911-bc83-b8211924ff3e').maybeSingle();
  console.log('News post:', data, error);
}

checkNews();
