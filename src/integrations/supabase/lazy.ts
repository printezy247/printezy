import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * The shared browser client, loaded on demand.
 *
 * `client.ts` pulls in auth-js, postgrest, realtime and storage — roughly
 * three quarters of a megabyte before minification. Imported at the top of a
 * route module, all of it lands in the browser entry chunk, even for pages
 * that never touch the database. Routes call this instead and pay for the
 * client only when they actually open a session.
 */
let pending: Promise<SupabaseClient<Database>> | null = null;

export function getSupabase(): Promise<SupabaseClient<Database>> {
  pending ??= import("./client").then((m) => m.supabase);
  return pending;
}
