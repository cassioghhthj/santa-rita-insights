import { createClient } from "@supabase/supabase-js";

const url =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  (typeof process !== "undefined" ? process.env.SUPABASE_URL : undefined);
const key =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  (typeof process !== "undefined" ? process.env.SUPABASE_PUBLISHABLE_KEY : undefined);

export const supabaseConfigured = Boolean(url && key);

// Fallback dummy values to keep the module importable before the user connects Supabase.
export const supabase = createClient(url ?? "http://localhost:54321", key ?? "public-anon-key", {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const EMPRESA_ID = "9b552309-91f5-44bf-9e6f-4e5416de7bff";
