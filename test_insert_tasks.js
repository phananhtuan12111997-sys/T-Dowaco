import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './apps/web/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testInsert() {
  const { error } = await supabase
    .from('tasks')
    .insert({
      title: 'Test',
      progress: 0,
      priority: 'Bình thường',
      due_date: new Date().toISOString(),
      status: 'Chưa bắt đầu',
      description: 'Test',
      attachments: []
    });
  
  if (error) {
    console.log("Insert error:", error.message, error.details, error.hint);
  } else {
    console.log("Insert successful!");
    // Clean up
    await supabase.from('tasks').delete().eq('title', 'Test');
  }
}

testInsert();
