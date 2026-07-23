import { json } from "@tanstack/react-start";
import { sql } from "~/db";

export async function GET() {
  try {
    const db = sql();
    await db`
      CREATE TABLE IF NOT EXISTS job_postings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name TEXT NOT NULL,
        contact_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        trade TEXT NOT NULL,
        description TEXT NOT NULL,
        location TEXT,
        budget TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    return json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json({ ok: false, error: message }, { status: 500 });
  }
}
