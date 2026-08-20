import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";
import { ensureSchoolSchema } from "~/lib/school-schema";
import { requireAdmin } from "~/lib/admin-auth";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/api/admin-school-suspend")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireAdmin(request);
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

        const id = typeof body.id === "string" ? body.id.trim() : "";
        if (!id || !UUID_RE.test(id)) {
          return new Response(JSON.stringify({ error: "Invalid school id" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const db = sql();
          await ensureSchoolSchema(db);

          const result = (await db`
            UPDATE schools
            SET status = 'suspended', updated_at = NOW()
            WHERE id = ${id}
            RETURNING id
          `) as { id: string }[];

          if (!result[0]) {
            return new Response(JSON.stringify({ error: "School not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[API-ADMIN-SUSPEND] ERROR:", msg);
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
