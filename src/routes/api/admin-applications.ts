import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";
import { requireAdmin } from "~/lib/admin-auth";
import type { ApprenticeApplication } from "~/lib/types";

export const Route = createFileRoute("/api/admin-applications")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;
        try {
          const db = sql();
          // Ensure the table exists (self-provisioning idiom used elsewhere).
          await db`
            CREATE TABLE IF NOT EXISTS apprentice_applications (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              full_name TEXT NOT NULL,
              email TEXT NOT NULL,
              phone TEXT,
              trade TEXT NOT NULL,
              experience TEXT,
              certifications TEXT,
              location TEXT,
              personal_statement TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW()
            )
          `;
          // Ensure the status column exists.
          await db`
            ALTER TABLE apprentice_applications
            ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new'
          `;
          const rows = (await db`
            SELECT id, full_name, email, phone, trade, experience, certifications, location, personal_statement, status, created_at
            FROM apprentice_applications
            ORDER BY created_at DESC
          `) as Record<string, unknown>[];
          const applications: ApprenticeApplication[] = rows.map((r) => ({
            id: String(r.id),
            full_name: (r.full_name as string) ?? "",
            email: (r.email as string) ?? "",
            phone: (r.phone as string | null) ?? null,
            trade: (r.trade as string) ?? "",
            experience: (r.experience as string | null) ?? null,
            certifications: (r.certifications as string | null) ?? null,
            location: (r.location as string | null) ?? null,
            personal_statement: (r.personal_statement as string | null) ?? null,
            status: (r.status as string) ?? "new",
            created_at: r.created_at ? String(r.created_at) : "",
          }));
          return new Response(JSON.stringify(applications), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[API-ADMIN-APPLICATIONS] ERROR:", msg);
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
