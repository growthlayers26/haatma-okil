/**
 * Supabase is optional at runtime.
 *
 * The document engine works without an account — a visitor drafts, previews and only
 * then signs in. Keeping the app functional with no credentials means a developer can
 * clone and run it, and means an outage in auth doesn't take the whole product down.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}
