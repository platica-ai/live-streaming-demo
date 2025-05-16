// api/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tnbsunhhihibxaghyjnf.supabase.co'; // ✅ Your project URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;     // ✅ Stored in .env file

export const supabase = createClient(supabaseUrl, supabaseKey);
