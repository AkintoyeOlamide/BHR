import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminEnv } from "./env";

export function createAdminClient() {
  const env = getSupabaseAdminEnv();

  if (!env) {
    throw new Error("SUPABASE_ADMIN_NOT_CONFIGURED");
  }

  return createClient(env.url, env.secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
