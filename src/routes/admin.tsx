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
  status: string;
  created_at: string;
};

type Match = {
  id: string;
  job_posting_id: string;
  application_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  company_name: string;
  job_trade: string;
  full_name: string;
  app_trade: string;
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
  // Ensure the status column exists
  await db`
    ALTER TABLE apprentice_applications
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new'
  `;
  const rows = await db`
    SELECT id, full_name, email, phone, trade, experience, certifications, location, personal_statement, status, created_at
    FROM apprentice_applications
    ORDER BY created_at DESC
  `;
  return rows.map((r) => ({
    ...r,
    status: r.status ?? "new",
    created_at: String(r.created_at),
  })) as ApprenticeApplication[];
});

const updateApplicationStatus = createServerFn().handler(
  async ({ id, status }: { id: string; status: string }): Promise<{ success: boolean; error?: string }> => {
    const db = sql();
    try {
      await db`
        ALTER TABLE apprentice_applications
        ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new'
      `;
      await db`
        UPDATE apprentice_applications SET status = ${status} WHERE id = ${id}
      `;
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return { success: false, error: message };
    }
  },
);

const getMatches = createServerFn().handler(async (): Promise<Match[]> => {
  const db = sql();
  // Ensure matches table exists
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
  const rows = await db`
    SELECT
      m.id,
      m.job_posting_id,
      m.application_id,
      m.status,
      m.notes,
      m.created_at,
      jp.company_name,
      jp.trade AS job_trade,
      aa.full_name,
      aa.trade AS app_trade
    FROM matches m
    JOIN job_postings jp ON m.job_posting_id = jp.id
    JOIN apprentice_applications aa ON m.application_id = aa.id
    ORDER BY m.created_at DESC
  `;
  return rows.map((r) => ({
    ...r,
    created_at: String(r.created_at),
    notes: r.notes ?? null,
  })) as Match[];
});

const createMatch = createServerFn().handler(
  async ({
    job_posting_id,
    application_id,
  }: {
    job_posting_id: string;
    application_id: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const db = sql();
    try {
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

      // Check for duplicate
      const existing = await db`
        SELECT id FROM matches
        WHERE job_posting_id = ${job_posting_id}
          AND application_id = ${application_id}
      `;
      if (existing.length > 0) {
        return { success: false, error: "Match already exists" };
      }

      await db`
        INSERT INTO matches (job_posting_id, application_id)
        VALUES (${job_posting_id}, ${application_id})
      `;
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return { success: false, error: message };
    }
  },
);

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

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  CSV helper                                                         */
/* ------------------------------------------------------------------ */

function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
  const lines: string[] = [];
  lines.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","));
  for (const row of rows) {
    lines.push(row.map((c) => `"${(c ?? "").replace(/"/g, '""')}"`).join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
/*  Status badge                                                       */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    new: { label: "New", classes: "bg-orange-100 text-orange-700" },
    reviewed: { label: "Reviewed", classes: "bg-green-100 text-green-700" },
    contacted: { label: "Contacted", classes: "bg-blue-100 text-blue-700" },
  };
  const c = config[status] ?? config.new;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${c.classes}`}>
      {c.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard components                                               */
/* ------------------------------------------------------------------ */

function StatsBar({
  jobCount,
  appCount,
  newThisWeek,
}: {
  jobCount: number;
  appCount: number;
  newThisWeek: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Total Job Postings</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-charcoal">{jobCount}</p>
      </div>
      <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Total Applications</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-charcoal">{appCount}</p>
      </div>
      <div className="rounded-2xl border border-brand/20 bg-brand-light p-6 shadow-sm">
        <p className="text-sm font-medium text-brand/80">New Applications This Week</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-brand">{newThisWeek}</p>
      </div>
    </div>
  );
}

function JobPostingsTable({
  data,
  onMatch,
}: {
  data: JobPosting[];
  onMatch: (jobId: string) => void;
}) {
  const handleExport = () => {
    const headers = ["Company", "Contact", "Email", "Phone", "Trade", "Description", "Location", "Budget", "Date"];
    const rows = data.map((r) => [
      r.company_name,
      r.contact_name,
      r.email,
      r.phone ?? "",
      r.trade,
      r.description,
      r.location ?? "",
      r.budget ?? "",
      formatDate(r.created_at),
    ]);
    downloadCsv(`job-postings-${todayStr()}.csv`, headers, rows);
  };

  if (data.length === 0) {
    return (
      <div>
        <div className="flex justify-end mb-3">
          <button
            onClick={handleExport}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
          >
            Export CSV
          </button>
        </div>
        <div className="rounded-2xl border border-gray-200/70 bg-white p-12 text-center shadow-sm">
          <p className="text-gray-400 text-sm">No job postings yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={handleExport}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
        >
          Export CSV
        </button>
      </div>
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
                <th className="px-4 py-3 text-center font-semibold text-gray-600 whitespace-nowrap w-20">Match</th>
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
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onMatch(row.id)}
                      className="rounded-lg bg-brand-light px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand hover:text-white transition-colors cursor-pointer"
                      title="Match with an apprentice"
                    >
                      Match
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ApplicationsTable({
  data,
  onStatusChange,
  onMatch,
}: {
  data: ApprenticeApplication[];
  onStatusChange: (id: string, newStatus: string) => void;
  onMatch: (appId: string) => void;
}) {
  const handleExport = () => {
    const headers = ["Name", "Email", "Phone", "Trade", "Experience", "Certifications", "Location", "Status", "Date"];
    const rows = data.map((r) => [
      r.full_name,
      r.email,
      r.phone ?? "",
      r.trade,
      r.experience ?? "",
      r.certifications ?? "",
      r.location ?? "",
      r.status,
      formatDate(r.created_at),
    ]);
    downloadCsv(`applications-${todayStr()}.csv`, headers, rows);
  };

  if (data.length === 0) {
    return (
      <div>
        <div className="flex justify-end mb-3">
          <button
            onClick={handleExport}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
          >
            Export CSV
          </button>
        </div>
        <div className="rounded-2xl border border-gray-200/70 bg-white p-12 text-center shadow-sm">
          <p className="text-gray-400 text-sm">No applications yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={handleExport}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
        >
          Export CSV
        </button>
      </div>
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
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Date</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 whitespace-nowrap w-20">Match</th>
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
                  <td className="px-4 py-3 whitespace-nowrap">
                    <select
                      value={row.status}
                      onChange={(e) => onStatusChange(row.id, e.target.value)}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 cursor-pointer hover:border-gray-300 focus:border-brand focus:ring-1 focus:ring-brand/20 focus:outline-none transition-colors"
                    >
                      <option value="new">🟠 New</option>
                      <option value="reviewed">🟢 Reviewed</option>
                      <option value="contacted">🔵 Contacted</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(row.created_at)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onMatch(row.id)}
                      className="rounded-lg bg-brand-light px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand hover:text-white transition-colors cursor-pointer"
                      title="Match with a job posting"
                    >
                      Match
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MatchesTable({ data }: { data: Match[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200/70 bg-white p-12 text-center shadow-sm">
        <p className="text-gray-400 text-sm">No matches yet. Use the "Match" buttons on job postings or applications to create matches.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((m) => (
        <div
          key={m.id}
          className="rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-medium text-brand">
              {m.job_trade}
            </span>
            <span className="text-xs text-gray-400">→</span>
            <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              {m.app_trade}
            </span>
          </div>
          <p className="text-sm font-semibold text-charcoal">{m.company_name}</p>
          <p className="text-xs text-gray-500 mt-0.5">→ {m.full_name}</p>
          <div className="mt-3 flex items-center justify-between">
            <StatusBadge status={m.status} />
            <span className="text-xs text-gray-400">{formatDate(m.created_at)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Match modal                                                        */
/* ------------------------------------------------------------------ */

function MatchModal({
  jobs,
  apps,
  preselectedJobId,
  preselectedAppId,
  onClose,
  onMatched,
}: {
  jobs: JobPosting[];
  apps: ApprenticeApplication[];
  preselectedJobId: string | null;
  preselectedAppId: string | null;
  onClose: () => void;
  onMatched: () => void;
}) {
  const [selectedJob, setSelectedJob] = useState(preselectedJobId ?? "");
  const [selectedApp, setSelectedApp] = useState(preselectedAppId ?? "");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleCreate = async () => {
    if (!selectedJob || !selectedApp) {
      setError("Please select both a job posting and an application.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const result = await createMatch({
        job_posting_id: selectedJob,
        application_id: selectedApp,
      });
      if (result.success) {
        setSuccess("Match created!");
        setTimeout(() => {
          onMatched();
          onClose();
        }, 800);
      } else {
        setError(result.error ?? "Failed to create match");
      }
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200/70 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-charcoal mb-4">Create Match</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Posting</label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-charcoal focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
            >
              <option value="">Select a job posting...</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.company_name} — {j.trade}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Apprentice Application</label>
            <select
              value={selectedApp}
              onChange={(e) => setSelectedApp(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-charcoal focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
            >
              <option value="">Select an application...</option>
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name} — {a.trade}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">{success}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover disabled:opacity-50 transition-colors cursor-pointer"
            >
              {creating ? "Creating..." : "Create Match"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                          */
/* ------------------------------------------------------------------ */

function Dashboard() {
  const [activeTab, setActiveTab] = useState<"jobs" | "apps" | "matches">("jobs");
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<ApprenticeApplication[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Match modal state
  const [matchModal, setMatchModal] = useState<{
    jobId: string | null;
    appId: string | null;
  } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [jobs, apps, matchList] = await Promise.all([
        getJobPostings(),
        getApplications(),
        getMatches(),
      ]);
      setJobPostings(jobs);
      setApplications(apps);
      setMatches(matchList);
      setLastRefreshed(new Date());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Optimistic update
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)),
    );
    const result = await updateApplicationStatus({ id, status: newStatus });
    if (!result.success) {
      // Revert on failure
      setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status: a.status } : a)));
    }
  };

  const handleOpenMatchModal = (jobId: string | null, appId: string | null) => {
    setMatchModal({ jobId, appId });
  };

  const handleMatchCreated = () => {
    // Reload matches
    getMatches().then(setMatches).catch(() => {});
  };

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/";
  };

  // Compute new applications this week
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const newThisWeek = applications.filter((a) => new Date(a.created_at) >= oneWeekAgo).length;

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
            <div className="flex items-center gap-3">
              {/* Refresh button */}
              <button
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-charcoal disabled:opacity-50 cursor-pointer"
                title="Refresh data"
              >
                <svg className={`size-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                </svg>
                Refresh
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 hover:border-red-300 cursor-pointer"
              >
                <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
                Log Out
              </button>
            </div>
          </div>

          {/* Last refreshed */}
          {lastRefreshed && (
            <p className="mt-2 text-xs text-gray-400">
              Last refreshed: {formatDateTime(lastRefreshed.toISOString())}
            </p>
          )}

          {/* Stats */}
          <div className="mt-6">
            <StatsBar jobCount={jobPostings.length} appCount={applications.length} newThisWeek={newThisWeek} />
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
                <button
                  onClick={loadData}
                  className="mt-4 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover cursor-pointer"
                >
                  Try Again
                </button>
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
                  <button
                    onClick={() => setActiveTab("matches")}
                    className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                      activeTab === "matches"
                        ? "border-brand text-brand"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Matches ({matches.length})
                  </button>
                </div>

                {/* Tab content */}
                {activeTab === "jobs" ? (
                  <JobPostingsTable
                    data={jobPostings}
                    onMatch={(jobId) => handleOpenMatchModal(jobId, null)}
                  />
                ) : activeTab === "apps" ? (
                  <ApplicationsTable
                    data={applications}
                    onStatusChange={handleStatusChange}
                    onMatch={(appId) => handleOpenMatchModal(null, appId)}
                  />
                ) : (
                  <MatchesTable data={matches} />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Match modal */}
      {matchModal && (
        <MatchModal
          jobs={jobPostings}
          apps={applications}
          preselectedJobId={matchModal.jobId}
          preselectedAppId={matchModal.appId}
          onClose={() => setMatchModal(null)}
          onMatched={handleMatchCreated}
        />
      )}
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
