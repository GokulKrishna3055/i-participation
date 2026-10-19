import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabase as sharedClient } from "@/integrations/supabase/client";
import { createTabSession } from "@/lib/tab-session";

// Each browser tab keeps its own login (sessionStorage + tab-unique storage key),
// so a student in one tab and an organiser in another never overwrite each other.
function create() {
  const tab = createTabSession(sessionStorage, crypto.randomUUID());
  const url = import.meta.env['VITE_SUPABASE_URL'] as string;
  const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string;
  return createClient<Database>(url, key, {
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
    auth: { storage: tab.storage, storageKey: tab.storageKey, persistSession: true, autoRefreshToken: true },
  });
}

let client: ReturnType<typeof create> | undefined;
export const supabase: ReturnType<typeof create> = typeof window === "undefined"
  ? (sharedClient as unknown as ReturnType<typeof create>)
  : (client ??= create());
