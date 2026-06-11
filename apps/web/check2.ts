import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const userId = '82946ebc-3dbe-47f0-b7ac-9682ef548624';

  const { count: dCount } = await supabase
    .from('document_recipients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('processing_status', 'Chưa xử lý');

  console.log("Documents Count for test3:", dCount);
}

check();
