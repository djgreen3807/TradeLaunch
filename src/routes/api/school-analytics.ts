import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";
import { ensureSchoolSchema } from "~/lib/school-schema";
import { requireSchoolAdmin } from "~/lib/school-admin";

/**
 * Bucket a Date into the Monday-start ISO week, returned as "YYYY-MM-DD".
 * Iterates backwards to Monday regardless of the current weekday.
 */
function mondayOfWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day; // Monday-start
  d.setUTCDate(d.getUTCDate() + diff);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${mm}-${dd}`;
}

export const Route = createFileRoute("/api/school-analytics")({
  server: {
    handlers: {
      // Gated: real metrics computed from the calling school's own students.
      POST: async ({ request }) => {
        try {
          const db = sql();
          await ensureSchoolSchema(db);
          const auth = await requireSchoolAdmin(db, request);
          if (!auth.ok) return auth.response;

          const rows = (await db`
            SELECT sp.trade AS trade,
                   sp.created_at AS created_at
            FROM school_members sm
            JOIN student_profiles sp ON sp.user_id = sm.user_id
            WHERE sm.school_id = ${auth.school.id}
              AND sm.role = 'student'
          `) as Record<string, unknown>[];

          const cleanTrade = (t: unknown) =>
            typeof t === "string" && t.trim() ? t.trim() : "Unknown";

          // Students grouped by trade (counts, desc).
          const tradeCounts = new Map<string, number>();
          for (const r of rows) {
            const t = cleanTrade(r.trade);
            tradeCounts.set(t, (tradeCounts.get(t) ?? 0) + 1);
          }
          const byTrade = [...tradeCounts.entries()]
            .map(([trade, count]) => ({ trade, count }))
            .sort((a, b) => b.count - a.count || a.trade.localeCompare(b.trade));

          // Signups by month ("YYYY-MM") and by week ("YYYY-MM-DD"), ascending.
          const monthCounts = new Map<string, number>();
          const weekCounts = new Map<string, number>();
          for (const r of rows) {
            const d = r.created_at instanceof Date ? r.created_at : new Date(String(r.created_at));
            if (Number.isNaN(d.getTime())) continue;
            const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
            monthCounts.set(ym, (monthCounts.get(ym) ?? 0) + 1);
            const wk = mondayOfWeek(d);
            weekCounts.set(wk, (weekCounts.get(wk) ?? 0) + 1);
          }
          const signupsByMonth = [...monthCounts.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([month, count]) => ({ month, count }));
          const signupsByWeek = [...weekCounts.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([week, count]) => ({ week, count }));

          return new Response(
            JSON.stringify({
              total: rows.length,
              byTrade,
              signupsByMonth,
              signupsByWeek,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[API-SCHOOL-ANALYTICS] ERROR:", msg);
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
