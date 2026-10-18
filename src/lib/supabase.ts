import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://eqjnugnknccfglcuzrvi.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey || "";

// Standard Supabase client (browser & public queries)
export const supabase = createClient(supabaseUrl, supabaseAnonKey || "missing-anon-key");

// Admin Supabase client with Service Role privileges (server-side only)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || "missing-service-key", {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
