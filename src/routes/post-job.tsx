import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { sql } from "~/db";
import { Header } from "~/components/Header";

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
  return { ok: true };
});

// submitJob removed — now using fetch to /api/submit-job

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TRADES = [
  "Electrical",
  "Plumbing",
  "HVAC",
  "Carpentry",
  "Welding",
  "Masonry",
  "Roofing",
  "Sheet Metal",
  "Painting",
  "Solar Installation",
  "Other",
];

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
  const [successContact, setSuccessContact] = useState("");

  // Ensure the table exists on first load
  useEffect(() => {
    ensureTable().catch(() => {
      // Silently ignore — table creation will be retried on submit
    });
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

    setSubmitting(true);
    try {
      const res = await fetch("/api/submit-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        setError(result.error || "Something went wrong. Please try again.");
      } else {
        setSuccessContact(result.contact_name);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  // Success state
  if (successContact) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-10 shadow-sm">
            <svg
              className="mx-auto size-14 text-green-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            <h2 className="mt-5 text-2xl font-bold text-charcoal">Thanks, {successContact}!</h2>
            <p className="mt-3 text-lg leading-relaxed text-gray-600">
              We&rsquo;ll review your posting and get back to you within 24 hours.
            </p>
            <a
              href="/"
              className="mt-8 inline-flex rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-hover"
            >
              Back to Homepage
            </a>
          </div>
        </main>
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
    </>
  );
}

export const Route = createFileRoute("/post-job")({
  head: () => ({
    meta: [{ title: "Post an Apprenticeship — TradeLaunch" }],
  }),
  component: PostJobPage,
});
