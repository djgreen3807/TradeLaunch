import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";
import { getUserFromRequest } from "~/lib/admin-auth";
import { getSchoolRole } from "~/lib/school-role";

export const Route = createFileRoute("/api/school-role")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await getUserFromRequest(request);
        if (!auth.ok) return auth.response;
        try {
          const db = sql();
          const result = await getSchoolRole(db, auth.userId, auth.email);
          return new Response(
            JSON.stringify({
              role: result.role,
              school: result.role === "school_admin" ? result.school : null,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[API-SCHOOL-ROLE] ERROR:", msg);
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
