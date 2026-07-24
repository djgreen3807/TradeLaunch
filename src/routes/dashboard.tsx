import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { supabase } from "~/lib/supabase";
import { sql } from "~/db";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type JobPosting = {
  id: string;
  company_name: string;
  trade: string;
  description: string;
  location: string | null;
  budget: string | null;
  created_at: string;
};

type MatchWithApplicant = {
  match_id: string;
  match_status: string;
  match_created_at: string;
  applicant_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  trade: string;
  experience: string | null;
  certifications: string | null;
  location: string | null;
  personal_statement: string | null;
  app_status: string;
};

type DashboardData = {
  jobs: (JobPosting & { matches: MatchWithApplicant[] })[];
};

/* ------------------------------------------------------------------ */
/*  Server function — runs only on the server                          */
/* ------------------------------------------------------------------ */

const fetchDashboardData = createServerFn().handler(
  async ({
    contractorId,
    contractorEmail,
  }: {
    contractorId: string;
    contractorEmail: string;
  }): Promise<DashboardData> => {
    const db = sql();

    // Ensure contractor_id column exists
    await db`
      ALTER TABLE job_postings
      ADD COLUMN IF NOT EXISTS contractor_id UUID
    `;

    // Fetch jobs: match by contractor_id (new) OR by email (legacy, no contractor_id)
    const jobs = await db`
      SELECT id, company_name, trade, description, location, budget, created_at
      FROM job_postings
      WHERE contractor_id = ${contractorId}
         OR (contractor_id IS NULL AND email = ${contractorEmail})
      ORDER BY created_at DESC
    `;

    const jobIds: string[] = jobs.map((j: { id: string }) => j.id);

    let allMatches: (MatchWithApplicant & { job_posting_id: string })[] = [];
    if (jobIds.length > 0) {
      await db`
        CREATE TABLE IF NOT EXISTS matches (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_posting_id UUID REFERENCES job_postings(id),
          application_id UUID REFERENCES apprentice_applications(id),
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

      allMatches = matchRows.map(
        (r: Record<string, unknown>) =>
          ({
            match_id: String(r.match_id),
            job_posting_id: String(r.job_posting_id),
            match_status: String(r.match_status),
            match_created_at: String(r.match_created_at),
            applicant_id: String(r.applicant_id),
            full_name: String(r.full_name),
            email: String(r.email),
            phone: r.phone ? String(r.phone) : null,
            trade: String(r.trade),
            experience: r.experience ? String(r.experience) : null,
            certifications: r.certifications ? String(r.certifications) : null,
            location: r.location ? String(r.location) : null,
            personal_statement: r.personal_statement
              ? String(r.personal_statement)
              : null,
            app_status: String(r.app_status ?? "new"),
          }) as MatchWithApplicant & { job_posting_id: string },
      );
    }

    const jobsWithMatches = jobs.map((j: Record<string, unknown>) => ({
      id: String(j.id),
      company_name: String(j.company_name),
      trade: String(j.trade),
      description: String(j.description),
      location: j.location ? String(j.location) : null,
      budget: j.budget ? String(j.budget) : null,
      created_at: String(j.created_at),
      matches: allMatches
        .filter((m) => m.job_posting_id === String(j.id))
        .map(({ job_posting_id: _jpId, ...rest }) => rest),
    }));

    return { jobs: jobsWithMatches };
  },
);

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

function DashboardPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<{
    user: { id: string; email?: string };
  } | null>(null);
  const [checking, setChecking] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Check auth on mount, then load dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) {
        navigate({ to: "/login" });
        setChecking(false);
        return;
      }
      setSession(s);
      setLoadingData(true);
      fetchDashboardData({
        contractorId: s.user.id,
        contractorEmail: s.user.email || "",
      })
        .then(setDashboard)
        .catch(console.error)
        .finally(() => {
          setLoadingData(false);
          setChecking(false);
        });
    });
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (checking) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-20 text-center">
          <p className="text-gray-500">Loading...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Top bar */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-charcoal">
              Contractor Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Signed in as {session.user.email}
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/post-job"
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-hover"
            >
              Post New Job
            </a>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loadingData && (
          <div className="rounded-2xl border border-gray-200/70 bg-white p-10 text-center shadow-sm">
            <p className="text-gray-500">Loading your dashboard...</p>
          </div>
        )}

        {/* Empty state */}
        {!loadingData && dashboard && dashboard.jobs.length === 0 && (
          <div className="rounded-2xl border border-gray-200/70 bg-white p-10 text-center shadow-sm">
            <svg
              className="mx-auto size-14 text-gray-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z"
              />
            </svg>
            <h2 className="mt-5 text-xl font-bold text-charcoal">
              You haven&rsquo;t posted any jobs yet.
            </h2>
            <p className="mt-2 text-gray-600">
              Create your first apprenticeship posting to start receiving
              matched applicants.
            </p>
            <a
              href="/post-job"
              className="mt-6 inline-flex rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-hover"
            >
              Post Your First Job
            </a>
          </div>
        )}

        {/* Jobs with matches */}
        {!loadingData &&
          dashboard &&
          dashboard.jobs.map((job) => (
            <div
              key={job.id}
              className="mb-8 rounded-2xl border border-gray-200/70 bg-white shadow-sm"
            >
              {/* Job header */}
              <div className="border-b border-gray-100 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-charcoal">
                      {job.company_name}
                    </h2>
                    <span className="mt-1 inline-block rounded-full bg-brand-light px-3 py-0.5 text-xs font-semibold text-brand">
                      {job.trade}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">
                    {new Date(job.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 line-clamp-2">
                  {job.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                  {job.location && <span>📍 {job.location}</span>}
                  {job.budget && <span>💰 {job.budget}</span>}
                </div>
              </div>

              {/* Matched applicants */}
              <div className="px-6 py-4">
                <h3 className="mb-3 text-sm font-semibold text-charcoal">
                  Matched Applicants{" "}
                  {job.matches.length > 0 && (
                    <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      {job.matches.length}
                    </span>
                  )}
                </h3>

                {job.matches.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    No matched applicants yet. We&rsquo;ll notify you when an
                    apprentice matches your posting.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {job.matches.map((match) => (
                      <div
                        key={match.match_id}
                        className="rounded-xl border border-gray-200 bg-warm-cream p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-charcoal">
                              {match.full_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {match.email}
                              {match.phone && ` • ${match.phone}`}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              match.match_status === "suggested"
                                ? "bg-purple-100 text-purple-700"
                                : match.match_status === "accepted"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {match.match_status}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                          <div>
                            <span className="font-medium">Trade:</span>{" "}
                            {match.trade}
                          </div>
                          {match.location && (
                            <div>
                              <span className="font-medium">Location:</span>{" "}
                              {match.location}
                            </div>
                          )}
                          {match.experience && (
                            <div className="sm:col-span-2">
                              <span className="font-medium">Experience:</span>{" "}
                              {match.experience}
                            </div>
                          )}
                          {match.certifications && (
                            <div className="sm:col-span-2">
                              <span className="font-medium">
                                Certifications:
                              </span>{" "}
                              {match.certifications}
                            </div>
                          )}
                          {match.personal_statement && (
                            <div className="sm:col-span-2">
                              <span className="font-medium">Statement:</span>{" "}
                              <span className="italic">
                                &ldquo;{match.personal_statement}&rdquo;
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
      </main>
      <Footer />
    </>
  );
}

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});
