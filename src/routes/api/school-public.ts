import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";
import { ensureSchoolSchema } from "~/lib/school-schema";
export const Route = createFileRoute("/api/school-public")({
  server: {
    handlers: {
      // Public: look up an approved school by slug for the /join/<slug> page.
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
        const slug =
          typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
        if (!slug) {
          return new Response(JSON.stringify({ error: "slug is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        try {
          const db = sql();
          await ensureSchoolSchema(db);
          const rows = (await db`
            SELECT id, name, slug, description, trades, city, state, website, logo_url
            FROM schools
            WHERE slug = ${slug} AND status = 'approved'
            LIMIT 1
          `) as Record<string, unknown>[];
          const school = rows[0];
          if (!school) {
            return new Response(
              JSON.stringify({ error: "Program not available" }),
              { status: 404, headers: { "Content-Type": "application/json" } },
            );
          }
          return new Response(
            JSON.stringify({
              id: String(school.id),
              name: (school.name as string) ?? "",
              slug: (school.slug as string) ?? "",
              description: (school.description as string | null) ?? null,
              trades: (school.trades as string | null) ?? null,
              city: (school.city as string | null) ?? null,
              state: (school.state as string | null) ?? null,
              website: (school.website as string | null) ?? null,
              logo_url: (school.logo_url as string | null) ?? null,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown database error";
          console.error("[API-SCHOOL-PUBLIC] ERROR:", msg);
          return new Response(
            JSON.stringify({ error: msg }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
