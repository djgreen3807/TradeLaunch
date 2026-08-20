/**
 * School Partner schema — self-provisioning table creation.
 * Mirrors the idiom used in src/routes/api/submit-application.ts: the tables are
 * created inline with `CREATE TABLE IF NOT EXISTS` on first use so no separate
 * migration step is required.
 */

export type Db = (q: TemplateStringsArray, ...args: unknown[]) => Promise<unknown>;

export async function ensureSchoolSchema(db: Db): Promise<void> {
  await db`
    CREATE TABLE IF NOT EXISTS schools (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT UNIQUE,
      website TEXT,
      description TEXT,
      logo_url TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      phone TEXT,
      contact_name TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      trades TEXT,
      student_count_estimate INTEGER,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      referral_code TEXT UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await db`
    CREATE TABLE IF NOT EXISTS school_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID NOT NULL REFERENCES schools(id),
      user_id UUID NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id)
    )
  `;
}
