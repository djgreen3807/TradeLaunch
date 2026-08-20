import { ensureSchoolSchema, type Db } from "~/lib/school-schema";

export type SchoolInfo = {
  id: string;
  name: string;
  slug: string | null;
  status: string;
};

export type SchoolRoleResult =
  | { role: "school_admin"; school: SchoolInfo }
  | { role: null };

function toSchool(r: Record<string, unknown>): SchoolInfo {
  const s = r as {
    id: string;
    name: string;
    slug: string | null;
    status: string;
  };
  return {
    id: String(s.id),
    name: s.name ?? "",
    slug: s.slug ?? null,
    status: s.status ?? "pending",
  };
}

/**
 * Resolve a Supabase user's role within the School Partner system.
 *
 * A school administrator is identified as a Supabase user whose email
 * (case-insensitive) matches an APPROVED school's `contact_email`. This keeps
 * `school_members` as the source of truth for roles while auto-linking an admin
 * to their school on first sign-in. One school per user (UNIQUE(user_id)).
 *
 * Logic:
 *   (a) ensure the `schools` + `school_members` tables exist;
 *   (b) look up `school_members` by `user_id` (role='school_admin'), join to
 *       `schools`, and return that school if it is status='approved';
 *   (c) else fall back to matching LOWER(contact_email)=LOWER(email) on an
 *       approved school and, if found, upsert a `school_members` row so the
 *       link persists;
 *   (d) else `{ role: null }`.
 */
export async function getSchoolRole(
  db: Db,
  userId: string,
  email: string,
): Promise<SchoolRoleResult> {
  await ensureSchoolSchema(db);

  // (b) Existing membership — school_members is the source of truth.
  const memberRows = (await db`
    SELECT s.id, s.name, s.slug, s.status
    FROM school_members sm
    JOIN schools s ON s.id = sm.school_id
    WHERE sm.user_id = ${userId}
      AND sm.role = 'school_admin'
      AND s.status = 'approved'
  `) as Record<string, unknown>[];
  if (memberRows[0]) {
    return { role: "school_admin", school: toSchool(memberRows[0]) };
  }

  // (c) Fallback — auto-link by matching an approved school's contact_email.
  const normEmail = (email ?? "").toLowerCase().trim();
  if (normEmail) {
    const matchRows = (await db`
      SELECT id, name, slug, status
      FROM schools
      WHERE LOWER(contact_email) = ${normEmail}
        AND status = 'approved'
    `) as Record<string, unknown>[];
    const school = matchRows[0];
    if (school) {
      await db`
        INSERT INTO school_members (school_id, user_id, role)
        VALUES (${String(school.id)}, ${userId}, 'school_admin')
        ON CONFLICT (user_id) DO UPDATE SET
          school_id = EXCLUDED.school_id,
          role = EXCLUDED.role,
          updated_at = NOW()
      `;
      return { role: "school_admin", school: toSchool(school) };
    }
  }

  // (d) No approved school membership.
  return { role: null };
}
