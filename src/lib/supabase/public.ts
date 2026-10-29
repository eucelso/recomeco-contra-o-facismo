import { createClient as createSupabase } from "@supabase/supabase-js";
import { assertSupabaseEnv, SUPABASE_KEY, SUPABASE_URL } from "./env";

/** Cliente anônimo, sem cookies: não torna a página dinâmica, então ela pode ser estática ou cacheada. */
export function createPublicClient() {
  assertSupabaseEnv();
  return createSupabase(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
