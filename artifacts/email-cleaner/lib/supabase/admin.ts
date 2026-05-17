import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client using the service role key.
 * Bypasses Row Level Security — use ONLY in trusted server contexts
 * such as webhook handlers where no user session is available.
 * Never expose to client code.
 */
export function createAdminClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase admin credentials. " +
      "Add SUPABASE_SERVICE_ROLE_KEY to your Replit secrets " +
      "(find it in your Supabase project → Settings → API)."
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
