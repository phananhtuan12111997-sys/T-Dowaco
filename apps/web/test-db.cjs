require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { error, data } = await supabaseAdmin
    .from('tasks')
    .insert({
      title: 'Test',
      description: 'Test',
      progress: 0,
      priority: 'Quan trọng',
      due_date: new Date().toISOString(),
      status: 'Chưa xử lý',
      created_by: 'bd03f56b-f726-444f-b31f-0e104e7cf402',
      attachments: []
    })
    .select();
  console.log('Error:', error);
}

test();
