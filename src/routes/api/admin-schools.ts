import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";
import { ensureSchoolSchema } from "~/lib/school-schema";
import { requireAdmin } from "~/lib/admin-auth";

export const Route = createFileRoute("/api/admin-schools")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        try {
          const db = sql();
          await ensureSchoolSchema(db);

          const rows = (await db`
            SELECT id, name, slug, status, city, state, contact_name, contact_email,
                   trades, student_count_estimate, message, referral_code, created_at
            FROM schools
            ORDER BY created_at DESC
          `) as Record<string, unknown>[];

          const schools = rows.map((r) => ({
            id: String(r.id),
            name: (r.name as string) ?? "",
            slug: (r.slug as string | null) ?? null,
            status: (r.status as string) ?? "pending",
            city: (r.city as string | null) ?? null,
            state: (r.state as string | null) ?? null,
            contact_name: (r.contact_name as string) ?? "",
            contact_email: (r.contact_email as string) ?? "",
            trades: (r.trades as string | null) ?? null,
            student_count_estimate:
              r.student_count_estimate != null
                ? Number(r.student_count_estimate)
                : null,
            message: (r.message as string | null) ?? null,
            referral_code: (r.referral_code as string | null) ?? null,
            created_at: r.created_at ? String(r.created_at) : null,
          }));

          return new Response(JSON.stringify(schools), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[API-ADMIN-SCHOOLS] ERROR:", msg);
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
