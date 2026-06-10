import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  const statuses = [
    'Chưa xử lý', 'Chờ xử lý', 'Chờ duyệt', 'Đang chờ duyệt', 'Báo cáo', 'Đã báo cáo', 'Đã gửi báo cáo', 
    'Đã trả lời', 'Đã trả lời/báo cáo', 'Hoàn thành', 'Đã hoàn thành', 'Đang thực hiện', 'Trả về'
  ];
  
  for (const status of statuses) {
    const { error } = await supabase
      .from('task_recipients')
      .update({ processing_status: status })
      .match({ id: '7fd20449-8492-4702-ad4d-178692440d25' })
      
    if (!error) {
      console.log('SUCCESS:', status);
      // Revert it back to something valid
      await supabase.from('task_recipients').update({ processing_status: 'Đang thực hiện' }).match({ id: '7fd20449-8492-4702-ad4d-178692440d25' });
    } else {
      console.log('FAILED:', status);
    }
  }
}

check()
