
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://npougftucphdtujkyyfz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wb3VnZnR1Y3BoZHR1amt5eWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3OTE5NjgsImV4cCI6MjA1OTM2Nzk2OH0.ltvi_jxyi5w60ds317ijULN8h1-vNTacY_KKuq6SWB4";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
