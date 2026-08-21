import { getUserFromRequest } from "~/lib/admin-auth";
import { getSchoolRole, type SchoolInfo } from "~/lib/school-role";
import type { Db } from "~/lib/school-schema";

/**
 * Shared auth guard for school admin API endpoints.
 *
 * Always resolves the caller's school server-side from their authenticated
 * identity (bearer token + `school_members`/`schools` lookup). Never trusts a
 * client-supplied school_id — the caller's school is the only one they can
 * read, which enforces per-school isolation.
 *
 * - unauthenticated -> `{ ok:false, response }` with HTTP 401
 * - authenticated, not a school admin -> `{ ok:false, response }` with HTTP 403
 * - school admin -> `{ ok:true, userId, email, school }`
 */
export type SchoolAdminResult =
  | { ok: true; userId: string; email: string; school: SchoolInfo }
  | { ok: false; response: Response };

export async function requireSchoolAdmin(
  db: Db,
  request: Request,
): Promise<SchoolAdminResult> {
  const auth = await getUserFromRequest(request);
  if (!auth.ok) return { ok: false, response: auth.response };

  const role = await getSchoolRole(db, auth.userId, auth.email);
  if (role.role !== "school_admin" || !role.school) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Forbidden: not a school admin" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      ),
    };
  }
  return { ok: true, userId: auth.userId, email: auth.email, school: role.school };
}
