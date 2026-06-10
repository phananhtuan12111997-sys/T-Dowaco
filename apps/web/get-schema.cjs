require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: taskData } = await supabaseAdmin.from('tasks').select('*').limit(1);
  const { data: recData } = await supabaseAdmin.from('task_recipients').select('*').limit(1);
  console.log('tasks:', Object.keys(taskData?.[0] || {}));
  console.log('task_recipients:', Object.keys(recData?.[0] || {}));
}
run();
