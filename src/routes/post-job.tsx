import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { sql } from "~/db";
import { supabase } from "~/lib/supabase";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { TRADES } from "~/lib/trades";
import { hasActivePlan } from "~/lib/payment-server";

/* ------------------------------------------------------------------ */
/*  Server functions                                                   */
/* ------------------------------------------------------------------ */

/** Creates the job_postings table if it doesn't already exist. */
const ensureTable = createServerFn().handler(async () => {
  const db = sql();
  await db`
    CREATE TABLE IF NOT EXISTS job_postings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      trade TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT,
      budget TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await db`
    ALTER TABLE job_postings
    ADD COLUMN IF NOT EXISTS contractor_id UUID
  `;
  return { ok: true };
});

// submitJob removed — now using fetch to /api/submit-job

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */


interface FormData {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  trade: string;
  description: string;
  location: string;
  budget: string;
}

const EMPTY_FORM: FormData = {
  company_name: "",
  contact_name: "",
  email: "",
  phone: "",
  trade: "",
  description: "",
  location: "",
  budget: "",
};

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

function PostJobPage() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [contractorId, setContractorId] = useState<string | null>(null);
  const [gate, setGate] = useState<"checking" | "loggedOut" | "noPlan" | "ready">("checking");
  const navigate = useNavigate();

  // Ensure the table exists on first load, and check auth + payment gate
  useEffect(() => {
    let cancelled = false;
    (async () => {
      ensureTable().catch(() => {
        // Silently ignore — table creation will be retried on submit
      });
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        if (!cancelled) setGate("loggedOut");
        return;
      }
      const id = data.session.user.id;
      setContractorId(id);

      // If we're returning from Stripe Checkout (?session_id=...), verify the
      // subscription synchronously (the webhook writes the same row, but this
      // makes the gate open immediately).
      const search = window.location.search;
      const href = window.location.href;
      console.log("[POST-JOB] Full URL:", href, "search:", search);
      const params = new URLSearchParams(search);
      const sessionId = params.get("session_id");
      console.log("[POST-JOB] sessionId from URL:", sessionId, "truthy:", Boolean(sessionId));
      if (sessionId) {
        console.log("[POST-JOB] Verifying checkout session via fetch:", sessionId, "user:", id);
        try {
          const res = await fetch("/api/verify-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, userId: id }),
          });
          const result = await res.json();
          console.log("[POST-JOB] verify-checkout result:", result);
          if (!result.ok) {
            setError(
              result.error
                ? `Verification failed: ${result.error}`
                : `Payment status is "${result.status}" — please ensure your card was charged.`,
            );
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[POST-JOB] fetch failed:", msg);
          setError(`Verification failed: ${msg}`);
        }
        if (!cancelled) {
          window.history.replaceState({}, "", "/post-job");
        }
      }

      let sub = null;
      try {
        const subRes = await fetch("/api/get-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: id }),
        });
        const subData = await subRes.json();
        sub = subData.sub ?? null;
        console.log("[POST-JOB] get-subscription result:", subData);
      } catch (err) {
        console.error("[POST-JOB] get-subscription fetch failed:", err);
      }

      console.log("[POST-JOB] Subscription row:", sub);
      console.log("[POST-JOB] BUILD=v4 — " + new Date().toISOString());
      if (!cancelled) {
        const planOk = hasActivePlan(sub);
        console.log("[POST-JOB] hasActivePlan:", planOk);
        window.__BUILD_TAG = "v4-" + Date.now();
        setGate(planOk ? "ready" : "noPlan");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Quick client-side check
    if (
      !form.company_name.trim() ||
      !form.contact_name.trim() ||
      !form.email.trim() ||
      !form.trade ||
      !form.description.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!agreedToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (contractorId) {
        payload.contractor_id = contractorId;
      }
      const res = await fetch("/api/submit-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        if (res.status === 402 || result.error === "PAYMENT_REQUIRED") {
          // Payment gate: send the contractor to pick a plan
          navigate({ to: "/select-plan" });
          return;
        }
        setError(result.error || "Something went wrong. Please try again.");
      } else {
        navigate({ to: "/thank-you" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (gate === "checking") {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-24 text-center">
          <p className="text-gray-500">Checking your account...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (gate === "loggedOut") {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-md px-4 py-24 sm:px-6">
          <div className="rounded-2xl border border-gray-200/70 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight text-charcoal">
              Log in to post a job
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              You need a contractor account to post an apprenticeship.
            </p>
            <a
              href="/login"
              className="mt-6 inline-flex w-full justify-center rounded-xl bg-brand px-6 py-3 text-base font-semibold text-white shadow-md transition-all hover:bg-brand-hover hover:shadow-lg"
            >
              Log in
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (gate === "noPlan") {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-md px-4 py-24 sm:px-6">
          <div className="rounded-2xl border border-gray-200/70 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight text-charcoal">
              Select a plan to continue
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              You need an active plan — Pay-Per-Placement ($299 on hire) or Monthly
              Unlimited ($149/mo) — before you can post an apprenticeship.
            </p>
            {/* v3 — diagnostics build */}
            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <a
              href="/select-plan"
              className="mt-6 inline-flex w-full justify-center rounded-xl bg-brand px-6 py-3 text-base font-semibold text-white shadow-md transition-all hover:bg-brand-hover hover:shadow-lg"
            >
              Choose a plan
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
        <>
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Page heading */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">
            Post an Apprenticeship
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-gray-600">
            Fill out the form below and we&rsquo;ll match you with pre-vetted apprentices in your trade.
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-gray-200/70 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Company name */}
            <div>
              <label htmlFor="company_name" className="block text-sm font-semibold text-charcoal">
                Company / Business Name <span className="text-brand">*</span>
              </label>
              <input
                id="company_name"
                type="text"
                required
                value={form.company_name}
                onChange={(e) => updateField("company_name", e.target.value)}
                placeholder="e.g. Metro Electric Co."
                className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Contact name */}
            <div>
              <label htmlFor="contact_name" className="block text-sm font-semibold text-charcoal">
                Contact Name <span className="text-brand">*</span>
              </label>
              <input
                id="contact_name"
                type="text"
                required
                value={form.contact_name}
                onChange={(e) => updateField("contact_name", e.target.value)}
                placeholder="e.g. John Rodriguez"
                className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Email + Phone row */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-charcoal">
                  Email <span className="text-brand">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="you@company.com"
                  className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-charcoal">
                  Phone <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                  className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </div>

            {/* Trade specialty */}
            <div>
              <label htmlFor="trade" className="block text-sm font-semibold text-charcoal">
                Trade Specialty <span className="text-brand">*</span>
              </label>
              <select
                id="trade"
                required
                value={form.trade}
                onChange={(e) => updateField("trade", e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                <option value="" disabled>
                  Select a trade...
                </option>
                {TRADES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Job description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-charcoal">
                Job Description <span className="text-brand">*</span>
              </label>
              <textarea
                id="description"
                required
                rows={5}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe the role, working conditions, hours, required certifications, etc."
                className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-semibold text-charcoal">
                Location
              </label>
              <input
                id="location"
                type="text"
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="e.g. Denver, CO"
                className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Budget / Hours */}
            <div>
              <label htmlFor="budget" className="block text-sm font-semibold text-charcoal">
                Budget / Hours
              </label>
              <input
                id="budget"
                type="text"
                value={form.budget}
                onChange={(e) => updateField("budget", e.target.value)}
                placeholder="e.g. Full-time, $18–$22/hr"
                className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Terms agreement checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 size-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              <span className="text-sm text-gray-600 leading-relaxed">
                I agree to the{" "}
                <a href="/terms" target="_blank" className="text-brand underline underline-offset-2 hover:text-brand-hover">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" target="_blank" className="text-brand underline underline-offset-2 hover:text-brand-hover">
                  Privacy Policy
                </a>
              </span>
            </label>

            {/* Error display */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-brand px-6 py-3 text-base font-semibold text-white shadow-md transition-all hover:bg-brand-hover hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Post Apprenticeship"}
            </button>
          </form>
        </div>
        </main>
        <Footer />
      </>
    );
  }
  
  export const Route = createFileRoute("/post-job")({
  component: PostJobPage,
});
