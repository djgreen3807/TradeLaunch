import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "~/lib/supabase";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

type SchoolInfo = { id: string; name: string; slug: string | null; status: string };
type Profile = {
  name: string;
  slug: string | null;
  status: string;
  description: string;
  website: string;
  logo_url: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
};

type RoleState =
  | { status: "checking" }
  | { status: "signedOut" }
  | { status: "denied" }
  | { status: "admin"; school: SchoolInfo; accessToken: string };

async function postGated<T>(
  path: string,
  accessToken: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const b = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(b?.error || `Request failed (${res.status})`);
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
        <h1 className="text-2xl font-bold tracking-tight text-charcoal">Edit School Profile</h1>
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

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-charcoal">{label}</label>
      {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const inputClass =
  "block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

function ProfileEditor({ accessToken }: { accessToken: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await postGated<Profile>("/api/school-profile", accessToken);
        if (!cancelled) setProfile(p);
      } catch {
        if (!cancelled) setError("We couldn't load your profile. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  function update<K extends keyof Profile>(key: K, value: string) {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await postGated<{ ok: boolean }>("/api/school-profile-update", accessToken, {
        description: profile.description,
        website: profile.website,
        logo_url: profile.logo_url,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zip: profile.zip,
        phone: profile.phone,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8">
          <Link
            to="/school/dashboard"
            className="text-sm font-semibold text-brand hover:text-brand-hover"
          >
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-charcoal">
            Edit School Profile
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            These details are shown on your public TradeLaunch School Partner profile.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {saved && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Your profile has been saved.
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm sm:p-8"
        >
          {loading || !profile ? (
            <p className="text-sm text-gray-500">Loading profile...</p>
          ) : (
            <>
              <div className="rounded-xl border border-gray-100 bg-warm-gray px-4 py-3 text-sm text-gray-600">
                <span className="font-semibold text-charcoal">{profile.name}</span>{" "}
                {profile.status && (
                  <span className="ml-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                    {profile.status}
                  </span>
                )}
              </div>

              <div className="mt-6 space-y-5">
                <Field label="Description" hint="A short overview of your program (up to 2000 characters).">
                  <textarea
                    rows={5}
                    maxLength={2000}
                    value={profile.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Tell students what your program offers..."
                    className={inputClass}
                  />
                </Field>

                <Field label="Website">
                  <input
                    type="url"
                    value={profile.website}
                    onChange={(e) => update("website", e.target.value)}
                    placeholder="https://www.yourschool.edu"
                    className={inputClass}
                  />
                </Field>

                <Field label="Logo URL" hint="A public URL to your school's logo image.">
                  <input
                    type="url"
                    value={profile.logo_url}
                    onChange={(e) => update("logo_url", e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className={inputClass}
                  />
                </Field>

                <Field label="Address">
                  <input
                    value={profile.address}
                    onChange={(e) => update("address", e.target.value)}
                    placeholder="123 Main St"
                    className={inputClass}
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-3">
                  <Field label="City">
                    <input
                      value={profile.city}
                      onChange={(e) => update("city", e.target.value)}
                      placeholder="Austin"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="State">
                    <input
                      value={profile.state}
                      onChange={(e) => update("state", e.target.value)}
                      placeholder="TX"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="ZIP">
                    <input
                      value={profile.zip}
                      onChange={(e) => update("zip", e.target.value)}
                      placeholder="78701"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field label="Phone" hint="A contact phone number for prospective students.">
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="(512) 555-0134"
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="mt-8 flex items-center gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
                {profile.slug && (
                  <a
                    href={`/schools/${profile.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-brand hover:text-brand-hover"
                  >
                    View public profile
                  </a>
                )}
              </div>
            </>
          )}
        </form>
      </main>
      <Footer />
    </>
  );
}

function ProfilePage() {
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
        const result = await postGated<{ role: string | null; school: SchoolInfo | null }>(
          "/api/school-role",
          session.access_token,
        );
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
  return <ProfileEditor accessToken={state.accessToken} />;
}

export const Route = createFileRoute("/school/profile")({
  component: ProfilePage,
});
