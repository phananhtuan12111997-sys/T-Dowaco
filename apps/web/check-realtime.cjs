require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
  const { data, error } = await supabase.from('notifications').select('id').limit(1);
  if (error) console.error('Error fetching:', error);
  else console.log('Successfully connected to Supabase');
  
  // To check realtime, we can't easily query pg_publication from standard API if we don't have access.
  // We can just add 'notifications' to the realtime publication manually using SQL.
}
check();
