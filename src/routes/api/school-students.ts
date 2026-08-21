import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";
import { ensureSchoolSchema } from "~/lib/school-schema";
import { requireSchoolAdmin } from "~/lib/school-admin";
import { listAuthUsers } from "~/lib/service-role";

export const Route = createFileRoute("/api/school-students")({
  server: {
    handlers: {
      // Gated: returns ONLY the calling school admin's students.
      // 401 if unauthenticated, 403 if not a school admin.
      POST: async ({ request }) => {
        try {
          const db = sql();
          await ensureSchoolSchema(db);
          const auth = await requireSchoolAdmin(db, request);
          if (!auth.ok) return auth.response;

          const rows = (await db`
            SELECT sp.user_id AS user_id,
                   sp.full_name AS full_name,
                   sp.trade AS trade,
                   sp.created_at AS joined_at
            FROM school_members sm
            JOIN student_profiles sp ON sp.user_id = sm.user_id
            WHERE sm.school_id = ${auth.school.id}
              AND sm.role = 'student'
            ORDER BY sp.created_at DESC
          `) as Record<string, unknown>[];

          const userMap = await listAuthUsers();
          const students = rows.map((r) => {
            const uid = String(r.user_id);
            const meta = userMap.get(uid);
            return {
              user_id: uid,
              full_name: (r.full_name as string) ?? "",
              trade: (r.trade as string) ?? "",
              email: meta?.email ?? "",
              joined_at: r.joined_at ? String(r.joined_at) : "",
            };
          });

          return new Response(JSON.stringify({ students }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[API-SCHOOL-STUDENTS] ERROR:", msg);
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
