import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "~/lib/supabase";

/**
 * Platform admins. The ONLY platform admin (per the owner) is djgreen2241@gmail.com.
 * School-approval endpoints are gated server-side by this allow-list — never rely
 * on hiding UI, because an attacker could otherwise approve their own school.
 */
export const ADMIN_EMAILS = ["djgreen2241@gmail.com"];

/**
 * A server-only Supabase client used to verify access tokens via `auth.getUser`.
 * Mirrors the client construction in `src/lib/supabase.ts` (same URL + key), but
 * with session persistence disabled since this client is only used to look up the
 * user behind a caller-supplied Bearer token, never to maintain a session.
 */
let _adminClient: ReturnType<typeof createClient> | null = null;

function getAdminClient() {
  if (!_adminClient) {
    _adminClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return _adminClient;
}

/**
 * Verify that the incoming request is authenticated as a platform admin.
 *
 * Reads the `Authorization: Bearer <access_token>` header, verifies the token
 * server-side via Supabase `auth.getUser`, extracts the user's email, and admits
 * the request only if that email is in ADMIN_EMAILS.
 *
 * - missing/invalid token  -> `{ ok: false, response }` with HTTP 401
 * - valid token, not admin -> `{ ok: false, response }` with HTTP 403
 * - valid token, admin     -> `{ ok: true, userId, email }`
 */
export async function requireAdmin(
  request: Request,
): Promise<
  | { ok: true; userId: string; email: string }
  | { ok: false; response: Response }
> {
  const authHeader = request.headers.get("authorization");
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : null;

  if (!token) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Unauthorized: missing bearer token" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      ),
    };
  }

  let data;
  try {
    const res = await getAdminClient().auth.getUser(token);
    data = res.data;
    if (res.error || !data?.user) {
      return {
        ok: false,
        response: new Response(
          JSON.stringify({ error: "Unauthorized: invalid token" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        ),
      };
    }
  } catch (err) {
    console.error("[ADMIN-AUTH] token verification failed:", err);
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Unauthorized: token verification failed" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      ),
    };
  }

  const email = (data.user.email ?? "").toLowerCase().trim();
  if (!ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email)) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Forbidden: not a platform admin" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      ),
    };
  }

  return { ok: true, userId: data.user.id, email };
}
