import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseClient: SupabaseClient | null = null;

export const LISTINGS_TABLE = "listings";
export const CATEGORIES_TABLE = "categories";

export function hasSupabaseConfig(): boolean {
  return Boolean(supabaseUrl && supabaseKey);
}

export function getSupabaseServerClient(): SupabaseClient {
  const url = supabaseUrl;
  const key = supabaseKey;

  if (!url || !key) {
    throw new Error("Supabase environment variables are not configured.");
  }

  if (!supabaseClient) {
    supabaseClient = createClient(url, key);
  }

  return supabaseClient;
}
