import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useEffect, useCallback } from "react";
import { sql } from "~/db";
import { Header } from "~/components/Header";

/* ------------------------------------------------------------------ */
/*  Server functions                                                   */
/* ------------------------------------------------------------------ */

type JobPosting = {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  trade: string;
  description: string;
  location: string | null;
  budget: string | null;
  created_at: string;
};

type ApprenticeApplication = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  trade: string;
  experience: string | null;
  certifications: string | null;
  location: string | null;
  personal_statement: string | null;
  created_at: string;
};

const getJobPostings = createServerFn().handler(async (): Promise<JobPosting[]> => {
  const db = sql();
  const rows = await db`
    SELECT id, company_name, contact_name, email, phone, trade, description, location, budget, created_at
    FROM job_postings
    ORDER BY created_at DESC
  `;
  return rows.map((r) => ({
    ...r,
    created_at: String(r.created_at),
  })) as JobPosting[];
});

const getApplications = createServerFn().handler(async (): Promise<ApprenticeApplication[]> => {
  const db = sql();
  // Ensure the table exists
  await db`
    CREATE TABLE IF NOT EXISTS apprentice_applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      trade TEXT NOT NULL,
      experience TEXT,
      certifications TEXT,
      location TEXT,
      personal_statement TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  const rows = await db`
    SELECT id, full_name, email, phone, trade, experience, certifications, location, personal_statement, created_at
    FROM apprentice_applications
    ORDER BY created_at DESC
  `;
  return rows.map((r) => ({
    ...r,
    created_at: String(r.created_at),
  })) as ApprenticeApplication[];
});

/* ------------------------------------------------------------------ */
/*  Auth helpers                                                       */
/* ------------------------------------------------------------------ */

const AUTH_KEY = "tradelaunch_admin_auth";
const ADMIN_PASSWORD = "tradelaunch2026";

function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(AUTH_KEY) === "true";
}

function setAuthenticated(): void {
  sessionStorage.setItem(AUTH_KEY, "true");
}

function clearAuth(): void {
  sessionStorage.removeItem(AUTH_KEY);
}

/* ------------------------------------------------------------------ */
/*  Format helpers                                                     */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Password gate component                                            */
/* ------------------------------------------------------------------ */

function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated();
      onSuccess();
    } else {
      setError("Incorrect password. Please try again.");
      setPassword("");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-cream px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-gray-200/70 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-charcoal">
              Trade<span className="text-brand">Launch</span>
            </h1>
            <p className="mt-2 text-sm text-gray-500">Admin Dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter admin password"
                autoFocus
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-charcoal placeholder-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-hover cursor-pointer"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard components                                               */
/* ------------------------------------------------------------------ */

function StatsBar({
  jobCount,
  appCount,
}: {
  jobCount: number;
  appCount: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Total Job Postings</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-charcoal">{jobCount}</p>
      </div>
      <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Total Applications</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-charcoal">{appCount}</p>
      </div>
    </div>
  );
}

function JobPostingsTable({ data }: { data: JobPosting[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200/70 bg-white p-12 text-center shadow-sm">
        <p className="text-gray-400 text-sm">No job postings yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Company</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Contact</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Trade</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Location</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Budget</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-warm-cream/50 transition-colors">
                <td className="px-4 py-3 font-medium text-charcoal whitespace-nowrap">{row.company_name}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.contact_name}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  <a href={`mailto:${row.email}`} className="text-brand hover:underline">{row.email}</a>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-medium text-brand">
                    {row.trade}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.location || "—"}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.budget || "—"}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(row.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ApplicationsTable({ data }: { data: ApprenticeApplication[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200/70 bg-white p-12 text-center shadow-sm">
        <p className="text-gray-400 text-sm">No applications yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Trade</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Experience</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Location</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-warm-cream/50 transition-colors">
                <td className="px-4 py-3 font-medium text-charcoal whitespace-nowrap">{row.full_name}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  <a href={`mailto:${row.email}`} className="text-brand hover:underline">{row.email}</a>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-medium text-brand">
                    {row.trade}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.experience || "—"}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{row.location || "—"}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(row.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState<"jobs" | "apps">("jobs");
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<ApprenticeApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [jobs, apps] = await Promise.all([
          getJobPostings(),
          getApplications(),
        ]);
        setJobPostings(jobs);
        setApplications(apps);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load data";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/";
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-warm-cream">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Top bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-charcoal">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage job postings and apprentice applications
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-charcoal cursor-pointer"
            >
              <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              Log Out
            </button>
          </div>

          {/* Stats */}
          <div className="mt-6">
            <StatsBar jobCount={jobPostings.length} appCount={applications.length} />
          </div>

          {/* Content */}
          <div className="mt-8">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-3 text-gray-500">
                  <svg className="size-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm">Loading dashboard data...</span>
                </div>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : (
              <>
                {/* Tab bar */}
                <div className="flex gap-2 border-b border-gray-200 mb-6">
                  <button
                    onClick={() => setActiveTab("jobs")}
                    className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                      activeTab === "jobs"
                        ? "border-brand text-brand"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Job Postings ({jobPostings.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("apps")}
                    className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                      activeTab === "apps"
                        ? "border-brand text-brand"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Applications ({applications.length})
                  </button>
                </div>

                {/* Tab content */}
                {activeTab === "jobs" ? (
                  <JobPostingsTable data={jobPostings} />
                ) : (
                  <ApplicationsTable data={applications} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component — auth gate                                        */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const [authed, setAuthed] = useState(() => isAuthenticated());

  const handleAuthSuccess = useCallback(() => {
    setAuthed(true);
  }, []);

  if (!authed) {
    return <PasswordGate onSuccess={handleAuthSuccess} />;
  }

  return <Dashboard />;
}
