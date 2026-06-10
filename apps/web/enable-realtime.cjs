require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const queries = [
    "ALTER PUBLICATION supabase_realtime ADD TABLE document_recipients;",
    "ALTER PUBLICATION supabase_realtime ADD TABLE task_recipients;",
    "ALTER PUBLICATION supabase_realtime ADD TABLE meetings;",
    "ALTER PUBLICATION supabase_realtime ADD TABLE notifications;"
  ];
  for (const query of queries) {
    const { error } = await supabaseAdmin.rpc('run_sql', { sql: query });
    if (error) {
      console.log('Error executing:', query, error.message);
      // Sometimes it fails because it's already added, that's fine.
    } else {
      console.log('Success:', query);
    }
  }
}
run();
