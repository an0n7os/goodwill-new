import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://eqjnugnknccfglcuzrvi.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey || "";

// Circuit breaker state to avoid waiting for dead or unreachable hosts on every request
const isKnownDeadHost = supabaseUrl.includes("eqjnugnknccfglcuzrvi.supabase.co");
let isCircuitOpen = isKnownDeadHost;
let lastCircuitCheck = isKnownDeadHost ? Date.now() : 0;
const CIRCUIT_RESET_MS = 300_000; // Retry health check after 5 minutes

export function isSupabaseCircuitOpen(): boolean {
  if (isCircuitOpen && Date.now() - lastCircuitCheck < CIRCUIT_RESET_MS) {
    return true; // Fast fail immediately in 0ms
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

// Standard Supabase client (browser & public queries) with fast 1.5s timeout instead of 8s
export const supabase = createClient(supabaseUrl, supabaseAnonKey || "missing-anon-key", {
  global: {
    fetch: (input, init) => {
      if (isSupabaseCircuitOpen()) {
        return Promise.reject(new Error("Supabase circuit breaker open (host offline)"));
      }
      return fetch(input, {
        ...init,
        signal: init?.signal
          ? AbortSignal.any([init.signal, AbortSignal.timeout(1500)])
          : AbortSignal.timeout(1500),
      }).catch((err) => {
        tripSupabaseCircuit();
        throw err;
      });
    },
  },
});

// Admin Supabase client with Service Role privileges (server-side only)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || "missing-service-key", {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

