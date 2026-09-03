// Like requireSupabaseAuth, but for endpoints that must work for signed-out
// guests too (e.g. checkout): resolves the caller's user id when the browser
// sent a valid session, and is null — never throws — otherwise.
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export const optionalSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

    const request = getRequest();
    const authHeader = request?.headers?.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !token || token.split(".").length !== 3) {
      return next({ context: { userId: null as string | null } });
    }

    try {
      const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await supabase.auth.getClaims(token);
      const userId = !error && data?.claims?.sub ? data.claims.sub : null;
      return next({ context: { userId } });
    } catch {
      return next({ context: { userId: null as string | null } });
    }
  },
);
