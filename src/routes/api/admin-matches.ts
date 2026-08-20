import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";
import { requireAdmin } from "~/lib/admin-auth";
import type { Match } from "~/lib/types";

export const Route = createFileRoute("/api/admin-matches")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;
        try {
          const db = sql();
          // Ensure matches table exists (self-provisioning idiom used elsewhere).
          await db`
            CREATE TABLE IF NOT EXISTS matches (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              job_posting_id UUID REFERENCES job_postings(id),
              application_id UUID REFERENCES apprentice_applications(id),
              status TEXT DEFAULT 'suggested',
              notes TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW()
            )
          `;
          const rows = (await db`
            SELECT
              m.id,
              m.job_posting_id,
              m.application_id,
              m.status,
              m.notes,
              m.created_at,
              jp.company_name,
              jp.trade AS job_trade,
              aa.full_name,
              aa.trade AS app_trade
            FROM matches m
            JOIN job_postings jp ON m.job_posting_id = jp.id
            JOIN apprentice_applications aa ON m.application_id = aa.id
            ORDER BY m.created_at DESC
          `) as Record<string, unknown>[];
          const matches: Match[] = rows.map((r) => ({
            id: String(r.id),
            job_posting_id: String(r.job_posting_id),
            application_id: String(r.application_id),
            status: (r.status as string) ?? "suggested",
            notes: (r.notes as string | null) ?? null,
            created_at: r.created_at ? String(r.created_at) : "",
            company_name: (r.company_name as string) ?? "",
            job_trade: (r.job_trade as string) ?? "",
            full_name: (r.full_name as string) ?? "",
            app_trade: (r.app_trade as string) ?? "",
          }));
          return new Response(JSON.stringify(matches), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[API-ADMIN-MATCHES] ERROR:", msg);
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
