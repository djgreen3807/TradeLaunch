import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";

export const Route = createFileRoute("/api/create-match")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Record<string, unknown>;
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const job_posting_id = typeof body.job_posting_id === "string" ? body.job_posting_id.trim() : "";
        const application_id = typeof body.application_id === "string" ? body.application_id.trim() : "";
        const notes = typeof body.notes === "string" ? body.notes.trim() : "";

        if (!job_posting_id || !application_id) {
          return new Response(
            JSON.stringify({ error: "Missing job_posting_id or application_id" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

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

          // Check for duplicate match
          const existing = await db`
            SELECT id FROM matches
            WHERE job_posting_id = ${job_posting_id}
              AND application_id = ${application_id}
          `;

          if (existing.length > 0) {
            return new Response(
              JSON.stringify({ error: "Match already exists", match_id: existing[0].id }),
              { status: 409, headers: { "Content-Type": "application/json" } },
            );
          }

          const result = await db`
            INSERT INTO matches (job_posting_id, application_id, notes)
            VALUES (${job_posting_id}, ${application_id}, ${notes || null})
            RETURNING id
          `;

          return new Response(
            JSON.stringify({ success: true, id: result[0].id }),
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
