require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabaseAdmin
    .from('task_comments')
    .select('*')
    .limit(1);
    
  if (error) {
    console.log('task_comments does not exist or error:', error.message);
  } else {
    console.log('task_comments exists!');
  }
}
run();
