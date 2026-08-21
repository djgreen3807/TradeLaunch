import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "~/lib/supabase";
import { ADMIN_EMAILS } from "~/lib/admin-auth";
import type { JobPosting, ApprenticeApplication, Match, School } from "~/lib/types";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

/* ------------------------------------------------------------------ */
/*  Gated API helpers                                                  */
/* ------------------------------------------------------------------ */

class NotAuthorizedError extends Error {
  constructor() {
    super("Not authorized");
    this.name = "NotAuthorizedError";
  }
}

/** POST to a gated /api endpoint with the admin Bearer token.
 *  Throws NotAuthorizedError on 401/403; returns the parsed JSON on success. */
async function gatedFetch<T>(
  path: string,
  accessToken: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 || res.status === 403) {
    throw new NotAuthorizedError();
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

/* ------------------------------------------------------------------ */
/*  Auth gate — Supabase sign-in                                       */
/* ------------------------------------------------------------------ */

function AdminLoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message);
      } else {
        onSuccess();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed.";
      setError(message);
    } finally {
      setLoading(false);
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
              <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="info@tradelaunch.work"
                autoFocus
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-charcoal placeholder-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-charcoal placeholder-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-hover disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

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
/*  Status badge                                                       */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    new: { label: "New", classes: "bg-orange-100 text-orange-700" },
    reviewed: { label: "Reviewed", classes: "bg-green-100 text-green-700" },
    contacted: { label: "Contacted", classes: "bg-blue-100 text-blue-700" },
    matched: { label: "Matched", classes: "bg-purple-100 text-purple-700" },
  };
  const c = config[status] ?? config.new;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${c.classes}`}>
      {c.label}
    </span>
  );
}

function SchoolStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    pending: { label: "Pending", classes: "bg-orange-100 text-orange-700" },
    approved: { label: "Approved", classes: "bg-green-100 text-green-700" },
    rejected: { label: "Rejected", classes: "bg-red-100 text-red-700" },
    suspended: { label: "Suspended", classes: "bg-gray-200 text-gray-600" },
  };
  const c = config[status] ?? config.pending;
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
                      <option value="matched">🟣 Matched</option>
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
/*  Schools table                                                      */
/* ------------------------------------------------------------------ */

function formatTrades(trades: string | null): string {
  if (!trades) return "—";
  try {
    const parsed = JSON.parse(trades);
    if (Array.isArray(parsed)) return parsed.join(", ");
  } catch {
    // not JSON — fall through to raw string
  }
  return trades;
}

function copyText(text: string): void {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
    return;
  }
  // Fallback for non-secure contexts
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
  } catch {
    // ignore
  }
  document.body.removeChild(ta);
}

function SchoolsTable({
  data,
  accessToken,
  onNotAuthorized,
  onRefresh,
}: {
  data: School[];
  accessToken: string;
  onNotAuthorized: () => void;
  onRefresh: () => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionOk, setActionOk] = useState("");

  const runAction = async (school: School, action: "approve" | "reject" | "suspend") => {
    setBusyId(school.id);
    setActionError("");
    setActionOk("");
    try {
      await gatedFetch<{ ok?: boolean }>(
        `/api/admin-school-${action}`,
        accessToken,
        { id: school.id },
      );
      setActionOk(
        action === "approve"
          ? `Approved "${school.name}" — referral link generated below.`
          : action === "reject"
            ? `Rejected "${school.name}".`
            : `Suspended "${school.name}".`,
      );
      onRefresh();
    } catch (err) {
      if (err instanceof NotAuthorizedError) {
        onNotAuthorized();
        return;
      }
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  if (data.length === 0) {
    return (
      <div>
        {actionError && (
          <p className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{actionError}</p>
        )}
        <div className="rounded-2xl border border-gray-200/70 bg-white p-12 text-center shadow-sm">
          <p className="text-gray-400 text-sm">No school applications yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {actionOk && (
        <p className="mb-3 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{actionOk}</p>
      )}
      {actionError && (
        <p className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{actionError}</p>
      )}
      <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">School</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Contact</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Trades</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Students</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Join Link</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((school) => (
                <tr key={school.id} className="hover:bg-warm-cream/50 transition-colors align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-charcoal">{school.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {[school.city, school.state].filter(Boolean).join(", ") || "—"}
                    </p>
                    {school.slug && (
                      <p className="text-xs text-gray-400 mt-0.5">slug: <span className="font-mono">{school.slug}</span></p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-600 whitespace-nowrap">{school.contact_name}</p>
                    <a href={`mailto:${school.contact_email}`} className="text-brand hover:underline text-xs">
                      {school.contact_email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className="text-xs">{formatTrades(school.trades)}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {school.student_count_estimate ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <SchoolStatusBadge status={school.status} />
                  </td>
                  <td className="px-4 py-3">
                    {school.slug && school.referral_code ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/join/${school.slug}`}
                            className="text-xs font-mono text-brand hover:underline whitespace-nowrap"
                            target="_blank"
                            rel="noreferrer"
                          >
                            /join/{school.slug}
                          </a>
                          <button
                            onClick={() => copyText(`/join/${school.slug}`)}
                            className="text-xs text-gray-400 hover:text-brand cursor-pointer"
                            title="Copy join URL"
                          >
                            ⧉
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-gray-500">ref: {school.referral_code}</code>
                          <button
                            onClick={() => copyText(school.referral_code!)}
                            className="text-xs text-gray-400 hover:text-brand cursor-pointer"
                            title="Copy referral code"
                          >
                            ⧉
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {school.created_at ? formatDate(school.created_at) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {(school.status === "pending" || school.status === "rejected") && (
                        <button
                          onClick={() => runAction(school, "approve")}
                          disabled={busyId === school.id}
                          className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                      )}
                      {school.status === "pending" && (
                        <button
                          onClick={() => runAction(school, "reject")}
                          disabled={busyId === school.id}
                          className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-200 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      )}
                      {school.status === "approved" && (
                        <button
                          onClick={() => runAction(school, "suspend")}
                          disabled={busyId === school.id}
                          className="rounded-lg bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-300 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
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

/* ------------------------------------------------------------------ */
/*  Match modal                                                        */
/* ------------------------------------------------------------------ */

function MatchModal({
  jobs,
  apps,
  preselectedJobId,
  preselectedAppId,
  accessToken,
  onNotAuthorized,
  onClose,
  onMatched,
}: {
  jobs: JobPosting[];
  apps: ApprenticeApplication[];
  preselectedJobId: string | null;
  preselectedAppId: string | null;
  accessToken: string;
  onNotAuthorized: () => void;
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
      const data = await gatedFetch<{ success?: boolean; error?: string }>(
        "/api/create-match",
        accessToken,
        {
          job_posting_id: selectedJob,
          application_id: selectedApp,
        },
      );
      if (data.success) {
        // Also update the application status to "matched" (the endpoint does
        // this itself; this is a harmless backstop to keep behavior identical)
        await gatedFetch<{ success?: boolean }>(
          "/api/update-application-status",
          accessToken,
          { id: selectedApp, status: "matched" },
        ).catch(() => {});
        setSuccess("Match created!");
        setTimeout(() => {
          onMatched();
          onClose();
        }, 800);
      } else {
        setError(data.error ?? "Failed to create match");
      }
    } catch (err) {
      if (err instanceof NotAuthorizedError) {
        onNotAuthorized();
      } else {
        setError("Network error");
      }
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

function Dashboard({
  accessToken,
  onNotAuthorized,
}: {
  accessToken: string;
  onNotAuthorized: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"jobs" | "apps" | "matches" | "schools">("jobs");
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<ApprenticeApplication[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
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
      const [jobs, apps, matchList, schoolList] = await Promise.all([
        gatedFetch<JobPosting[]>("/api/admin-jobs", accessToken),
        gatedFetch<ApprenticeApplication[]>("/api/admin-applications", accessToken),
        gatedFetch<Match[]>("/api/admin-matches", accessToken),
        gatedFetch<School[]>("/api/admin-schools", accessToken),
      ]);
      setJobPostings(jobs);
      setApplications(apps);
      setMatches(matchList);
      setSchools(schoolList);
      setLastRefreshed(new Date());
    } catch (err) {
      if (err instanceof NotAuthorizedError) {
        onNotAuthorized();
        return;
      }
      const msg = err instanceof Error ? err.message : "Failed to load data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken, onNotAuthorized]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Optimistic update
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)),
    );
    try {
      const data = await gatedFetch<{ success?: boolean }>(
        "/api/update-application-status",
        accessToken,
        { id, status: newStatus },
      );
      if (!data.success) {
        // Revert on failure
        setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status: a.status } : a)));
      }
    } catch (err) {
      // Revert on error
      setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status: a.status } : a)));
      if (err instanceof NotAuthorizedError) {
        onNotAuthorized();
      }
    }
  };

  const handleOpenMatchModal = (jobId: string | null, appId: string | null) => {
    setMatchModal({ jobId, appId });
  };

  const handleMatchCreated = () => {
    // Reload matches and applications to reflect new statuses
    Promise.all([
      gatedFetch<Match[]>("/api/admin-matches", accessToken),
      gatedFetch<ApprenticeApplication[]>("/api/admin-applications", accessToken),
    ])
      .then(([matchList, appList]) => {
        setMatches(matchList);
        setApplications(appList);
      })
      .catch(() => {});
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
                  <button
                    onClick={() => setActiveTab("schools")}
                    className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                      activeTab === "schools"
                        ? "border-brand text-brand"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Schools ({schools.length})
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
                ) : activeTab === "matches" ? (
                  <MatchesTable data={matches} />
                ) : (
                  <SchoolsTable
                    data={schools}
                    accessToken={accessToken}
                    onNotAuthorized={onNotAuthorized}
                    onRefresh={loadData}
                  />
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
          accessToken={accessToken}
          onNotAuthorized={onNotAuthorized}
          onClose={() => setMatchModal(null)}
          onMatched={handleMatchCreated}
        />
      )}
      <Footer />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component — auth gate                                        */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type AdminAuthState =
  | { status: "checking" }
  | { status: "signedOut" }
  | { status: "denied"; email: string }
  | { status: "authorized"; accessToken: string; email: string };

function AdminPage() {
  const [auth, setAuth] = useState<AdminAuthState>({ status: "checking" });

  const applySession = useCallback(async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) => {
    if (!session) {
      setAuth({ status: "signedOut" });
      return;
    }
    const email = (session.user.email ?? "").toLowerCase().trim();
    const isAdmin = ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email);
    if (!isAdmin) {
      // Not a platform admin — sign out and show the restricted screen.
      await supabase.auth.signOut();
      setAuth({ status: "denied", email });
      return;
    }
    setAuth({ status: "authorized", accessToken: session.access_token, email });
  }, []);

  useEffect(() => {
    // Check for existing Supabase session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session);
    });
  }, [applySession]);

  const handleAuthSuccess = useCallback(async () => {
    // Re-read the fresh session established by the login gate.
    const { data: { session } } = await supabase.auth.getSession();
    applySession(session);
  }, [applySession]);

  const handleNotAuthorized = useCallback(async () => {
    await supabase.auth.signOut();
    setAuth({ status: "denied", email: "" });
  }, []);

  if (auth.status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-cream">
        <div className="flex items-center gap-3 text-gray-500">
          <svg className="size-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Checking session...</span>
        </div>
      </div>
    );
  }

  if (auth.status === "signedOut") {
    return <AdminLoginGate onSuccess={handleAuthSuccess} />;
  }

  if (auth.status === "denied") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-cream px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200/70 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">Access Restricted</h1>
          <p className="mt-3 text-sm text-gray-600">
            Not authorized — this area is restricted to platform administrators.
          </p>
          <a
            href="/"
            className="mt-6 inline-block rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover cursor-pointer"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <Dashboard
      accessToken={auth.accessToken}
      onNotAuthorized={handleNotAuthorized}
    />
  );
}
