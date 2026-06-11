import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  // Use admin client to sign in or we don't have password. 
  // We can't easily get a user's JWT without logging in.
}

check();
