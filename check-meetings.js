import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'apps/web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
    // Attempt to query pg_policies using an RPC if it exists, or just REST query if possible
    // Actually we can query pg_policies? REST API does not expose pg_policies.
    // Let's fetch all meetings using anon/user client and admin client to see if they differ
    console.log('Fetching meetings as admin...');
    const { data: adminMeetings, error: adminErr } = await supabaseAdmin.from('meetings').select('*');
    if (adminErr) console.error(adminErr);
    console.log(`Admin sees ${adminMeetings?.length || 0} meetings.`);

}

checkPolicies();
