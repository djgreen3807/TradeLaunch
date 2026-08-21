import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "~/lib/supabase";
import { TRADES } from "~/lib/trades";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

type SchoolInfo = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  trades: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
};

type Load =
  | { status: "loading" }
  | { status: "available"; school: SchoolInfo }
  | { status: "unavailable" };

function JoinPage() {
  const { slug } = Route.useParams();
  const [load, setLoad] = useState<Load>({ status: "loading" });

  const [fullName, setFullName] = useState("");
  const [trade, setTrade] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [hasSession, setHasSession] = useState(false);
  // true once email confirmation flow sent the user to check their inbox
  const [confirmation, setConfirmation] = useState(false);
  const [joined, setJoined] = useState<SchoolInfo | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadSchool() {
    try {
      const res = await fetch("/api/school-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.ok) {
        const school = (await res.json()) as SchoolInfo;
        setLoad({ status: "available", school });
      } else {
        setLoad({ status: "unavailable" });
      }
    } catch {
      setLoad({ status: "unavailable" });
    }
  }

  useEffect(() => {
    void loadSchool();
    void supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  function toggleMode() {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError("");
  }

  async function ensureSession(): Promise<boolean> {
    if (hasSession) {
      const sess = await supabase.auth.getSession();
      if (sess.data.session) return true;
      // Fall through — session expired on the client; try to re-establish.
    }
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    if (mode === "signin") {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError(authError.message);
        return false;
      }
      setHasSession(true);
      return true;
    }
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (signUpError) {
      setError(signUpError.message);
      return false;
    }
    if (data.session) {
      // Auto-confirmed — we have a session now, proceed.
      setHasSession(true);
      return true;
    }
    // Email confirmation required. Don't join yet — they must confirm first,
    // then come back and sign in to finish joining.
    setConfirmation(true);
    return false;
  }

  async function finalizeJoin(school: SchoolInfo, accessToken: string) {
    const res = await fetch("/api/join-school", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ slug: school.slug, full_name: fullName.trim(), trade }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      setError(data.error ?? "Something went wrong joining. Please try again.");
      return;
    }
    setJoined(school);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (load.status !== "available") return;
    const school = load.school;
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!trade) {
      setError("Please select a trade.");
      return;
    }
    setLoading(true);
    try {
      const ready = await ensureSession();
      if (!ready) return;
      const sess = await supabase.auth.getSession();
      const token = sess.data.session?.access_token;
      if (!token) {
        setError("Please sign in to continue.");
        return;
      }
      await finalizeJoin(school, token);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function renderTrades(trades: string | null) {
    if (!trades) return null;
    const list = trades
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (list.length === 0) return null;
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {list.map((t) => (
          <span
            key={t}
            className="rounded-full border border-brand/30 bg-brand-light px-3 py-1 text-xs font-medium text-brand"
          >
            {t}
          </span>
        ))}
      </div>
    );
  }

  const school = load.status === "available" ? load.school : null;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="rounded-2xl border border-gray-200/70 bg-white p-8 shadow-sm">
          {load.status === "loading" && (
            <div className="py-10 text-center text-sm text-gray-500">
              Loading program…
            </div>
          )}

          {load.status === "unavailable" && (
            <div className="py-10 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-charcoal">
                This program isn't available
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                We couldn't find a School Partner program at this link. It may
                not be approved yet, or the link may be wrong. Please check with
                your school or visit TradeLaunch to learn more.
              </p>
            </div>
          )}

          {school && (
            <div>
              {/* School heading */}
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-charcoal">
                  {school.name}
                </h1>
                <p className="mt-2 text-sm font-semibold text-brand">
                  Join this school's program
                </p>
                {school.description && (
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">
                    {school.description}
                  </p>
                )}
                {(school.city || school.state) && (
                  <p className="mt-3 text-sm text-gray-500">
                    {[school.city, school.state].filter(Boolean).join(", ")}
                  </p>
                )}
                {renderTrades(school.trades)}
              </div>

              {/* Confirmation state */}
              {joined ? (
                <div className="mt-8 rounded-xl border border-green-200 bg-green-50 px-4 py-6 text-center">
                  <p className="text-base font-semibold text-green-700">
                    You're in!
                  </p>
                  <p className="mt-1 text-sm text-green-700">
                    You've joined {joined.name}'s program as a student. Your
                    school can now refer you to matching apprenticeships.
                  </p>
                </div>
              ) : confirmation ? (
                /* Email confirmation state */
                <div className="mt-8 rounded-xl border border-green-200 bg-green-50 px-4 py-6 text-center">
                  <p className="text-sm text-green-700">
                    Check your email for a confirmation link, then sign in here
                    to finish joining.
                  </p>
                  <button
                    onClick={() => setConfirmation(false)}
                    className="mt-4 text-sm font-semibold text-brand underline underline-offset-2 hover:text-brand-hover cursor-pointer"
                  >
                    Go to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
                  {/* Full name */}
                  <div>
                    <label
                      htmlFor="full_name"
                      className="block text-sm font-semibold text-charcoal"
                    >
                      Full name
                    </label>
                    <input
                      id="full_name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Smith"
                      className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  {/* Trade */}
                  <div>
                    <label
                      htmlFor="trade"
                      className="block text-sm font-semibold text-charcoal"
                    >
                      Trade
                    </label>
                    <select
                      id="trade"
                      value={trade}
                      onChange={(e) => setTrade(e.target.value)}
                      className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    >
                      <option value="">Select a trade…</option>
                      {TRADES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Auth fields — only when there's no Supabase session */}
                  {!hasSession && !confirmation && (
                    <>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-semibold text-charcoal"
                        >
                          Email
                        </label>
                        <input
                          id="email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="password"
                          className="block text-sm font-semibold text-charcoal"
                        >
                          Password
                        </label>
                        <input
                          id="password"
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                        />
                      </div>
                    </>
                  )}

                  {/* Error display */}
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-brand px-6 py-3 text-base font-semibold text-white shadow-md transition-all hover:bg-brand-hover hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? "Joining…"
                      : hasSession
                        ? "Join this school's program"
                        : mode === "signin"
                          ? "Sign in & join"
                          : "Create account & join"}
                  </button>
                </form>
              )}

              {/* Auth mode toggle — only when there's no session */}
              {!hasSession && !joined && !confirmation && (
                <p className="mt-6 text-center text-sm text-gray-600">
                  {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
                  <button
                    onClick={toggleMode}
                    className="font-semibold text-brand underline underline-offset-2 hover:text-brand-hover cursor-pointer"
                  >
                    {mode === "signin" ? "Create one now" : "Sign in"}
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export const Route = createFileRoute("/join/$slug")({
  component: JoinPage,
});
