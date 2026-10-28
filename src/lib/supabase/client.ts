import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseEnv, SUPABASE_KEY, SUPABASE_URL } from "./env";

export function createClient() {
  assertSupabaseEnv();
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
