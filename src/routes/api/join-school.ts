import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";
import { ensureSchoolSchema } from "~/lib/school-schema";
import { getUserFromRequest } from "~/lib/admin-auth";
import { TRADES } from "~/lib/trades";
export const Route = createFileRoute("/api/join-school")({
  server: {
    handlers: {
      // Gated: a logged-in student joins an approved school. One school per
      // student, enforced by school_members.UNIQUE(user_id).
      POST: async ({ request }) => {
        const auth = await getUserFromRequest(request);
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
        const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
        const slug = str(body.slug).toLowerCase();
        const full_name = str(body.full_name);
        const trade = str(body.trade);
        if (!slug) {
          return new Response(JSON.stringify({ error: "slug is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (!full_name) {
          return new Response(
            JSON.stringify({ error: "full_name is required" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }
        if (!TRADES.includes(trade)) {
          return new Response(
            JSON.stringify({ error: "A valid trade is required" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }
        try {
          const db = sql();
          await ensureSchoolSchema(db);
          const schoolRows = (await db`
            SELECT id, name, slug FROM schools
            WHERE slug = ${slug} AND status = 'approved'
            LIMIT 1
          `) as { id: string; name: string; slug: string }[];
          const school = schoolRows[0];
          if (!school) {
            return new Response(
              JSON.stringify({ error: "Program not available" }),
              { status: 404, headers: { "Content-Type": "application/json" } },
            );
          }
          // Upsert the student profile. ON CONFLICT (user_id) DO UPDATE so a
          // returning student can update their details.
          await db`
            INSERT INTO student_profiles (user_id, full_name, trade, updated_at)
            VALUES (${auth.userId}, ${full_name}, ${trade}, NOW())
            ON CONFLICT (user_id) DO UPDATE SET
              full_name = EXCLUDED.full_name,
              trade = EXCLUDED.trade,
              updated_at = NOW()
          `;
          // Upsert the school membership. UNIQUE(user_id) enforces one school
          // per student; DO UPDATE moves them to the new school if they join
          // another one.
          await db`
            INSERT INTO school_members (school_id, user_id, role, updated_at)
            VALUES (${school.id}, ${auth.userId}, 'student', NOW())
            ON CONFLICT (user_id) DO UPDATE SET
              school_id = EXCLUDED.school_id,
              role = EXCLUDED.role,
              updated_at = NOW()
          `;
          return new Response(
            JSON.stringify({ ok: true, school: { name: school.name, slug: school.slug } }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown database error";
          console.error("[API-JOIN-SCHOOL] ERROR:", msg);
          return new Response(
            JSON.stringify({ error: msg }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
