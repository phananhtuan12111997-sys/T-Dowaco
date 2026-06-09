import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'apps/web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
    const { data, error } = await supabase.rpc('get_policies');
    // If rpc doesn't exist, we can query pg_policies using postgres connection if we had one.
    // Instead, let's just use REST to query a system view if exposed, or just bypass it.
    
    // As a workaround, let's check if the document actually gets deleted if we use service role.
    const { data: docs } = await supabase.from('documents').select('id, created_by').limit(1);
    console.log("Docs:", docs);
}

checkPolicies();
