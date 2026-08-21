import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";
import { ensureSchoolSchema } from "~/lib/school-schema";
import { requireSchoolAdmin } from "~/lib/school-admin";

export const Route = createFileRoute("/api/school-profile")({
  server: {
    handlers: {
      // Gated: returns the calling school admin's own school profile (the
      // editable fields for /school/profile). 401 if unauthenticated, 403 if
      // not a school admin. The caller's school is resolved server-side from
      // their authenticated identity — never from the client.
      POST: async ({ request }) => {
        try {
          const db = sql();
          await ensureSchoolSchema(db);
          const auth = await requireSchoolAdmin(db, request);
          if (!auth.ok) return auth.response;

          const rows = (await db`
            SELECT name, slug, status, description, website, logo_url,
                   address, city, state, zip, phone
            FROM schools
            WHERE id = ${auth.school.id}
            LIMIT 1
          `) as Record<string, unknown>[];
          const s = rows[0];
          if (!s) {
            return new Response(JSON.stringify({ error: "School not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(
            JSON.stringify({
              name: (s.name as string) ?? "",
              slug: (s.slug as string | null) ?? null,
              status: (s.status as string) ?? "",
              description: (s.description as string | null) ?? "",
              website: (s.website as string | null) ?? "",
              logo_url: (s.logo_url as string | null) ?? "",
              address: (s.address as string | null) ?? "",
              city: (s.city as string | null) ?? "",
              state: (s.state as string | null) ?? "",
              zip: (s.zip as string | null) ?? "",
              phone: (s.phone as string | null) ?? "",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[API-SCHOOL-PROFILE] ERROR:", msg);
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
