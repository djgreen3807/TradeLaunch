import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";
import { ensureSchoolSchema } from "~/lib/school-schema";
import { requireSchoolAdmin } from "~/lib/school-admin";

type ProfileFields = {
  description: string;
  website: string;
  logo_url: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
};

function clean(v: unknown, maxLen: number): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, maxLen);
}

export const Route = createFileRoute("/api/school-profile-update")({
  server: {
    handlers: {
      // Gated: updates ONLY the calling school admin's own school row, resolved
      // server-side via requireSchoolAdmin — never from a client-supplied
      // school_id. Editable fields are limited to the public profile fields;
      // name/slug/status are intentionally not editable here.
      POST: async ({ request }) => {
        try {
          const db = sql();
          await ensureSchoolSchema(db);
          const auth = await requireSchoolAdmin(db, request);
          if (!auth.ok) return auth.response;

          let body: Record<string, unknown>;
          try {
            body = await request.json();
          } catch {
            return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const fields: ProfileFields = {
            description: clean(body.description, 2000),
            website: clean(body.website, 250),
            logo_url: clean(body.logo_url, 500),
            address: clean(body.address, 250),
            city: clean(body.city, 120),
            state: clean(body.state, 60),
            zip: clean(body.zip, 20),
            phone: clean(body.phone, 40),
          };

          await db`
            UPDATE schools
            SET description = ${fields.description},
                website = ${fields.website},
                logo_url = ${fields.logo_url},
                address = ${fields.address},
                city = ${fields.city},
                state = ${fields.state},
                zip = ${fields.zip},
                phone = ${fields.phone},
                updated_at = NOW()
            WHERE id = ${auth.school.id}
          `;

          return new Response(
            JSON.stringify({ ok: true, slug: auth.school.slug }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[API-SCHOOL-PROFILE-UPDATE] ERROR:", msg);
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
