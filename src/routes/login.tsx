import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "~/lib/supabase";
import { Header } from "~/components/Header";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
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
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-md px-4 py-20 sm:px-6 sm:py-28">
        <div className="rounded-2xl border border-gray-200/70 bg-white p-8 shadow-sm">
          {/* Heading */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-charcoal">
              Contractor Login
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Sign in to manage your job postings and applicants.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
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
                placeholder="you@company.com"
                className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Password */}
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
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Don&rsquo;t have an account?{" "}
            <a
              href="/post-job"
              className="font-semibold text-brand underline underline-offset-2 hover:text-brand-hover"
            >
              Post a job to get started
            </a>
          </p>
        </div>
      </main>
    </>
  );
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
