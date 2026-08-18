import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";

export const Route = createFileRoute("/api/dashboard")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json() as {
          contractorId?: string;
          contractorEmail?: string;
        };
        const { contractorId, contractorEmail } = body;

        if (!contractorId) {
          return new Response(
            JSON.stringify({ error: "Missing contractorId" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        try {
          const db = sql();

          await db`
            ALTER TABLE job_postings
            ADD COLUMN IF NOT EXISTS contractor_id UUID
          `;

          const jobs = await db`
            SELECT id, company_name, trade, description, location, budget, created_at
            FROM job_postings
            WHERE contractor_id = ${contractorId}
               OR (contractor_id IS NULL AND email = ${contractorEmail ?? ""})
            ORDER BY created_at DESC
          `;

          const jobIds: string[] = jobs.map((j: { id: string }) => j.id);

          let matchesByJob: Record<string, unknown[]> = {};
          if (jobIds.length > 0) {
            try {
              await db`
                CREATE TABLE IF NOT EXISTS matches (
                  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                  job_posting_id UUID,
                  application_id UUID,
                  status TEXT DEFAULT 'suggested',
                  notes TEXT,
                  created_at TIMESTAMPTZ DEFAULT NOW()
                )
              `;

              const matchRows = await db`
                SELECT
                  m.id AS match_id,
                  m.job_posting_id,
                  m.status AS match_status,
                  m.created_at AS match_created_at,
                  aa.id AS applicant_id,
                  aa.full_name,
                  aa.email,
                  aa.phone,
                  aa.trade,
                  aa.experience,
                  aa.certifications,
                  aa.location,
                  aa.personal_statement,
                  aa.status AS app_status
                FROM matches m
                JOIN apprentice_applications aa ON m.application_id = aa.id
                WHERE m.job_posting_id = ANY(${jobIds})
                ORDER BY m.created_at DESC
              `;

              for (const r of matchRows as Record<string, unknown>[]) {
                const jpid = String(r.job_posting_id);
                if (!matchesByJob[jpid]) matchesByJob[jpid] = [];
                const { job_posting_id: _jpId, ...rest } = r;
                matchesByJob[jpid].push({
                  match_id: String(rest.match_id),
                  match_status: String(rest.match_status),
                  match_created_at: String(rest.match_created_at),
                  applicant_id: String(rest.applicant_id),
                  full_name: String(rest.full_name),
                  email: String(rest.email),
                  phone: rest.phone ? String(rest.phone) : null,
                  trade: String(rest.trade),
                  experience: rest.experience ? String(rest.experience) : null,
                  certifications: rest.certifications
                    ? String(rest.certifications)
                    : null,
                  location: rest.location ? String(rest.location) : null,
                  personal_statement: rest.personal_statement
                    ? String(rest.personal_statement)
                    : null,
                  app_status: String(rest.app_status ?? "new"),
                });
              }
            } catch (err) {
              // matches/apprentice_applications tables may not exist yet —
              // degrade gracefully so jobs still render.
              console.error("[API-DASHBOARD] matches query failed:", err);
              matchesByJob = {};
            }
          }

          const jobsWithMatches = (jobs as Record<string, unknown>[]).map((j) => ({
            id: String(j.id),
            company_name: String(j.company_name),
            trade: String(j.trade),
            description: String(j.description),
            location: j.location ? String(j.location) : null,
            budget: j.budget ? String(j.budget) : null,
            created_at: String(j.created_at),
            matches: matchesByJob[String(j.id)] ?? [],
          }));

          return new Response(
            JSON.stringify({ jobs: jobsWithMatches }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[API-DASHBOARD] ERROR:", msg);
          return new Response(
            JSON.stringify({ error: msg }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
