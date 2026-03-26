import { createClient } from "@supabase/supabase-js";

declare global {
  // eslint-disable-next-line no-var
  var __supabaseBrowserClient: ReturnType<typeof createClient> | undefined;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseBrowser =
  globalThis.__supabaseBrowserClient ??
  (globalThis.__supabaseBrowserClient = createClient(supabaseUrl, supabaseAnonKey));
