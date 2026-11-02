import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://eqjnugnknccfglcuzrvi.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey || "";

// Circuit breaker state to avoid hanging if host is unreachable
let isCircuitOpen = false;
let lastCircuitCheck = 0;
const CIRCUIT_RESET_MS = 60_000; // Retry health check after 1 minute

export function isSupabaseCircuitOpen(): boolean {
  if (isCircuitOpen && Date.now() - lastCircuitCheck < CIRCUIT_RESET_MS) {
    return true; // Fast fail immediately
  }
  return false;
}

export function tripSupabaseCircuit() {
  isCircuitOpen = true;
  lastCircuitCheck = Date.now();
}

export function resetSupabaseCircuit() {
  isCircuitOpen = false;
  lastCircuitCheck = Date.now();
}

// Standard Supabase client (browser & public queries)
export const supabase = createClient(supabaseUrl, supabaseAnonKey || "missing-anon-key", {
  global: {
    fetch: (input, init) => {
      if (isSupabaseCircuitOpen()) {
        return Promise.reject(new Error("Supabase circuit breaker open (host offline)"));
      }
      return fetch(input, {
        ...init,
        signal: init?.signal
          ? AbortSignal.any([init.signal, AbortSignal.timeout(3000)])
          : AbortSignal.timeout(3000),
      }).catch((err) => {
        tripSupabaseCircuit();
        throw err;
      });
    },
  },
});

// Admin Supabase client with Service Role privileges (server-side only)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
