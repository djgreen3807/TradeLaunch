import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "~/lib/supabase";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleMode() {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (authError) {
          setError(authError.message);
        } else {
          navigate({ to: "/select-plan" });
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (signUpError) {
          setError(signUpError.message);
        } else if (data.session) {
          // Auto-confirmed — go straight to plan selection
          navigate({ to: "/select-plan" });
        } else {
          // Email confirmation required
          setSuccess(
            "Account created! Check your email for a confirmation link, then sign in.",
          );
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const isSignIn = mode === "signin";

  return (
    <>
      <Header />
      <main className="mx-auto max-w-md px-4 py-20 sm:px-6 sm:py-28">
        <div className="rounded-2xl border border-gray-200/70 bg-white p-8 shadow-sm">
          {/* Heading */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-charcoal">
              {isSignIn ? "Contractor Login" : "Create Account"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {isSignIn
                ? "Sign in to post jobs and manage applicants."
                : "Create a free account to start posting apprenticeships."}
            </p>
          </div>

          {success ? (
            /* Email confirmation message */
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-6 text-center">
              <p className="text-sm text-green-700">{success}</p>
              <button
                onClick={() => setMode("signin")}
                className="mt-4 text-sm font-semibold text-brand underline underline-offset-2 hover:text-brand-hover cursor-pointer"
              >
                Go to Sign In
              </button>
            </div>
          ) : (
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
                {loading
                  ? isSignIn
                    ? "Signing in..."
                    : "Creating account..."
                  : isSignIn
                    ? "Sign In"
                    : "Create Account"}
              </button>
            </form>
          )}

          {/* Toggle link */}
          {!success && (
            <p className="mt-6 text-center text-sm text-gray-600">
              {isSignIn ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={toggleMode}
                className="font-semibold text-brand underline underline-offset-2 hover:text-brand-hover cursor-pointer"
              >
                {isSignIn ? "Create one now" : "Sign in"}
              </button>
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
