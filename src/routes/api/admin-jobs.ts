import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";
import { requireAdmin } from "~/lib/admin-auth";
import type { JobPosting } from "~/lib/types";

export const Route = createFileRoute("/api/admin-jobs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;
        try {
          const db = sql();
          const rows = (await db`
            SELECT id, company_name, contact_name, email, phone, trade, description, location, budget, created_at
            FROM job_postings
            ORDER BY created_at DESC
          `) as Record<string, unknown>[];
          const jobs: JobPosting[] = rows.map((r) => ({
            id: String(r.id),
            company_name: (r.company_name as string) ?? "",
            contact_name: (r.contact_name as string) ?? "",
            email: (r.email as string) ?? "",
            phone: (r.phone as string | null) ?? null,
            trade: (r.trade as string) ?? "",
            description: (r.description as string) ?? "",
            location: (r.location as string | null) ?? null,
            budget: (r.budget as string | null) ?? null,
            created_at: r.created_at ? String(r.created_at) : "",
          }));
          return new Response(JSON.stringify(jobs), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[API-ADMIN-JOBS] ERROR:", msg);
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
