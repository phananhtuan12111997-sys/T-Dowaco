const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listTables() {
  const { data, error } = await supabase.rpc('get_tables'); // Or query information_schema
  
  const { data: tables, error: err } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
    
  if (err) console.error(err);
  else console.log(tables.map(t => t.table_name));
}

listTables();
