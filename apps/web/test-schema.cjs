require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const statuses = ['To Do', 'In Progress', 'Done', 'Chờ tiếp nhận', 'Đang thực hiện', 'Hoàn tất', 'Đã hủy', 'Đã hoàn thành', 'Chưa thực hiện', 'pending', 'in_progress', 'completed'];
  for (const status of statuses) {
    const { error } = await supabaseAdmin.from('tasks').insert({
      title: 'Test', description: 'Test', progress: 0, priority: 'Quan trọng', due_date: new Date().toISOString(),
      status, created_by: 'bd03f56b-f726-444f-b31f-0e104e7cf402', attachments: []
    });
    if (!error) {
      console.log('Success with status:', status);
      return;
    } else {
      console.log('Failed with status:', status, error.message);
    }
  }
}
test();
