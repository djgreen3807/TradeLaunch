import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "~/lib/supabase";

/**
 * Server-only Supabase admin client for looking up auth users by id (used to
 * resolve student emails in the school dashboard). This is the only way to read
 * the Supabase `auth.users` table — it is a separate Postgres from the Neon app
 * database, so it cannot be joined from SQL.
 *
 * The real service-role key is delivered to the server as `SUPABASE_PROJECT_REF`
 * (a JWT with role=service_role for this project). The anon key is used
 * everywhere else for normal auth; here we need service-role so we can list
 * users beyond the single caller.
 */
let _serviceClient: ReturnType<typeof createClient> | null = null;

function getServiceClient(): ReturnType<typeof createClient> | null {
  const key =
    typeof process !== "undefined" && process.env?.SUPABASE_PROJECT_REF;
  if (!key) return null;
  if (!_serviceClient) {
    _serviceClient = createClient(getSupabaseUrl(), key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return _serviceClient;
}

export type AuthUserInfo = { email: string; display_name: string | null };

/**
 * Fetch all Supabase auth users and return a map keyed by user id. Used to
 * enrich student rows with their email/display name. Returns an empty map if
 * the service-role key is unavailable (endpoint still works, just without
 * those fields).
 */
export async function listAuthUsers(): Promise<Map<string, AuthUserInfo>> {
  const map = new Map<string, AuthUserInfo>();
  const client = getServiceClient();
  if (!client) return map;

  const perPage = 200;
  let page = 1;
  for (;;) {
    let data;
    try {
      const res = await client.auth.admin.listUsers({ page, perPage });
      data = res.data;
      if (res.error || !data?.users?.length) break;
    } catch {
      break;
    }
    for (const u of data.users) {
      const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
      map.set(u.id, {
        email: (u.email ?? "").toLowerCase().trim(),
        display_name:
          typeof meta.full_name === "string" && meta.full_name.trim()
            ? meta.full_name.trim()
            : null,
      });
    }
    if (data.users.length < perPage) break;
    page++;
  }
  return map;
}
