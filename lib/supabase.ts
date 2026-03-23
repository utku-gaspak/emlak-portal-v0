import "server-only";

import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const LISTINGS_TABLE = "listings";
export const CATEGORIES_TABLE = "categories";

export function getSupabaseServerClient() {
  return supabase;
}
