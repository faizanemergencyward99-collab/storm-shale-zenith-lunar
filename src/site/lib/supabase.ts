// Supabase client. The anon key is meant to be public; Row-Level Security
// protects the data. Env vars override the new project if they are set.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const FALLBACK_URL = "https://jqhstwtmhtsupkiwatyv.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxaHN0d3RtaHRzdXBraXdhdHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NjYzMTksImV4cCI6MjEwODQ0MjMxOX0.5pl_uVBO6Pje-3Uw0NBHn-2eVgCFUJ-VpPofbUun8vc";

export const SUPABASE_URL = (
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || FALLBACK_URL
).replace(/\/+$/, "");

export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || FALLBACK_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  realtime: { params: { eventsPerSecond: 10 } },
});
