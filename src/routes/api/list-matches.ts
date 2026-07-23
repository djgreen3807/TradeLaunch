import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";

export const Route = createFileRoute("/api/list-matches")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const db = sql();

          // Ensure matches table exists
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

          const rows = await db`
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
          `;

          const matches = rows.map((r) => ({
            ...r,
            created_at: String(r.created_at),
            notes: r.notes ?? null,
          }));

          return new Response(
            JSON.stringify({ matches }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown database error";
          return new Response(
            JSON.stringify({ error: message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
