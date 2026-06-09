import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({path: '.env.local'});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function check() {
  const { data } = await supabase.from('profiles').select('department');
  if (data) {
    const deps = [...new Set(data.map(d => d.department))];
    console.log('Departments:', deps);
  }
}
check();
