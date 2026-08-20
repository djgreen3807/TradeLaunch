import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "~/lib/supabase";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

type SchoolInfo = { id: string; name: string; slug: string | null; status: string };

type RoleState =
  | { status: "checking" }
  | { status: "signedOut" }
  | { status: "denied" }
  | { status: "admin"; school: SchoolInfo };

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

function PlaceholderCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-charcoal">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
      <span className="mt-4 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
        Coming soon
      </span>
    </div>
  );
}

function SchoolDashboard({ school }: { school: SchoolInfo }) {
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

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <PlaceholderCard
            title="Students"
            description="Manage the students who joined through your school."
          />
          <PlaceholderCard
            title="Invite / QR"
            description="Get your unique signup link and QR code to share with students."
          />
          <PlaceholderCard
            title="Profile"
            description="Update your school's public profile and details."
          />
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
          setState({ status: "admin", school: result.school });
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
  return <SchoolDashboard school={state.school} />;
}

export const Route = createFileRoute("/school/dashboard")({
  component: SchoolDashboardPage,
});
