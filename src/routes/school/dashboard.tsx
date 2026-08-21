import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "~/lib/supabase";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

type SchoolInfo = { id: string; name: string; slug: string | null; status: string };

type RoleState =
  | { status: "checking" }
  | { status: "signedOut" }
  | { status: "denied" }
  | { status: "admin"; school: SchoolInfo; accessToken: string };

type Student = {
  user_id: string;
  full_name: string;
  trade: string;
  email: string;
  joined_at: string;
};

type Analytics = {
  total: number;
  byTrade: { trade: string; count: number }[];
  signupsByMonth: { month: string; count: number }[];
  signupsByWeek: { week: string; count: number }[];
};

const JOIN_BASE = "https://www.tradelaunch.work/join/";

async function fetchSchoolRole(
  accessToken: string,
): Promise<{ role: string | null; school: SchoolInfo | null }> {
  const res = await fetch("/api/school-role", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (res.status === 401 || res.status === 403) {
    return { role: null, school: null };
  }
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json() as Promise<{ role: string | null; school: SchoolInfo | null }>;
}

async function postGated<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

function CheckingScreen() {
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

function SignInScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-cream px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200/70 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-charcoal">
          School Partner Dashboard
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          Sign in to continue to your School Partner dashboard.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-block rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover cursor-pointer"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

function NotAuthorizedScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-cream px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200/70 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-charcoal">Not Authorized</h1>
        <p className="mt-3 text-sm text-gray-600">
          This area is for approved School Partners. Sign in with the email your
          school used to apply, then contact us if you believe this is a mistake.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover cursor-pointer"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-semibold text-charcoal">{title}</h2>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function StudentsList({ students }: { students: Student[] }) {
  if (students.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No students have joined your school yet. Share your invite link or QR
        code to start building your apprentice network.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
            <th className="py-2 pr-4 font-semibold">Name</th>
            <th className="py-2 pr-4 font-semibold">Trade</th>
            <th className="py-2 pr-4 font-semibold">Email</th>
            <th className="py-2 font-semibold">Joined</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.user_id} className="border-b border-gray-100 last:border-0">
              <td className="py-3 pr-4 font-medium text-charcoal">
                {s.full_name || "—"}
              </td>
              <td className="py-3 pr-4 text-gray-700">
                {s.trade || "—"}
              </td>
              <td className="py-3 pr-4 text-gray-700">
                {s.email || "—"}
              </td>
              <td className="py-3 text-gray-500">
                {s.joined_at ? new Date(s.joined_at).toLocaleDateString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InviteQRSection({ slug }: { slug: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!slug) {
    return (
      <p className="text-sm text-gray-500">
        A unique signup slug hasn't been set for your school yet. Contact us to
        have one created.
      </p>
    );
  }
  const joinLink = `${JOIN_BASE}${slug}`;
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — nothing to do
    }
  }
  return (
    <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <QRCodeSVG value={joinLink} size={160} bgColor="#ffffff" fgColor="#1a1a1a" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-charcoal">Student signup link</p>
        <p className="mt-1 break-all text-sm text-gray-600">{joinLink}</p>
        <button
          onClick={handleCopy}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover cursor-pointer"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}

function AnalyticsPanel({ analytics }: { analytics: Analytics }) {
  const maxTrade = analytics.byTrade.length
    ? Math.max(...analytics.byTrade.map((t) => t.count), 1)
    : 1;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <p className="text-sm font-medium text-charcoal">Students by trade</p>
        {analytics.byTrade.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No data yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {analytics.byTrade.map((t) => (
              <li key={t.trade}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-charcoal">{t.trade}</span>
                  <span className="text-gray-500">{t.count}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${(t.count / maxTrade) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-charcoal">Signups by month</p>
          {analytics.signupsByMonth.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No data yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {analytics.signupsByMonth.map((m) => (
                <li key={m.month} className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-700">{m.month}</span>
                  <span className="font-medium text-charcoal">{m.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-charcoal">Signups by week</p>
          {analytics.signupsByWeek.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No data yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {analytics.signupsByWeek.map((w) => (
                <li key={w.week} className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-700">{w.week}</span>
                  <span className="font-medium text-charcoal">{w.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfilePlaceholder() {
  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-semibold text-charcoal">Profile</h2>
      <p className="mt-1 text-sm text-gray-600">
        Update your school's public profile and details.
      </p>
      <span className="mt-4 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
        Coming soon
      </span>
    </div>
  );
}

function SchoolDashboard({ school, accessToken }: { school: SchoolInfo; accessToken: string }) {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sRes, aRes] = await Promise.all([
          postGated<{ students: Student[] }>("/api/school-students", accessToken),
          postGated<Analytics>("/api/school-analytics", accessToken),
        ]);
        if (cancelled) return;
        setStudents(sRes.students);
        setAnalytics(aRes);
      } catch {
        if (!cancelled) setError("We couldn't load your dashboard data. Please try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-2xl border border-gray-200/70 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-brand">School Partner</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-charcoal">{school.name}</h1>
            </div>
            <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              Approved
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-6">
          <SectionCard
            title="Students"
            description="Manage the students who joined through your school."
          >
            {students === null && !error ? (
              <p className="text-sm text-gray-500">Loading students...</p>
            ) : (
              <StudentsList students={students ?? []} />
            )}
          </SectionCard>

          <SectionCard
            title="Invite / QR"
            description="Share your unique signup link and QR code with students."
          >
            <InviteQRSection slug={school.slug} />
          </SectionCard>

          <SectionCard
            title="Analytics"
            description="Real signup metrics for your school's apprentice network."
          >
            {analytics === null && !error ? (
              <p className="text-sm text-gray-500">Loading analytics...</p>
            ) : (
              <AnalyticsPanel analytics={analytics ?? { total: 0, byTrade: [], signupsByMonth: [], signupsByWeek: [] }} />
            )}
          </SectionCard>

          <ProfilePlaceholder />
        </div>
      </main>
      <Footer />
    </>
  );
}

function SchoolDashboardPage() {
  const [state, setState] = useState<RoleState>({ status: "checking" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) setState({ status: "signedOut" });
        return;
      }
      try {
        const result = await fetchSchoolRole(session.access_token);
        if (cancelled) return;
        if (result.role === "school_admin" && result.school) {
          setState({ status: "admin", school: result.school, accessToken: session.access_token });
        } else {
          setState({ status: "denied" });
        }
      } catch {
        if (!cancelled) setState({ status: "denied" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "checking") return <CheckingScreen />;
  if (state.status === "signedOut") return <SignInScreen />;
  if (state.status === "denied") return <NotAuthorizedScreen />;
  return <SchoolDashboard school={state.school} accessToken={state.accessToken} />;
}

export const Route = createFileRoute("/school/dashboard")({
  component: SchoolDashboardPage,
});
