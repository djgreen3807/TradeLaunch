import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { sql } from "~/db";
import { Header } from "~/components/Header";

/* ------------------------------------------------------------------ */
/*  Server functions                                                   */
/* ------------------------------------------------------------------ */

/** Creates the apprentice_applications table if it doesn't already exist. */
const ensureTable = createServerFn().handler(async () => {
  const db = sql();
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
  return { ok: true };
});

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

const EXPERIENCE_LEVELS = [
  "None — just starting",
  "Less than 1 year",
  "1–2 years",
  "3–5 years",
  "5+ years",
];

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  trade: string;
  experience: string;
  certifications: string;
  location: string;
  personal_statement: string;
}

const EMPTY_FORM: FormData = {
  full_name: "",
  email: "",
  phone: "",
  trade: "",
  experience: "",
  certifications: "",
  location: "",
  personal_statement: "",
};

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

function ApplyPage() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{ full_name: string; trade: string } | null>(null);

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
    if (!form.full_name.trim() || !form.email.trim() || !form.trade) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/submit-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        setError(result.error || "Something went wrong. Please try again.");
      } else {
        setSuccessData({ full_name: result.full_name, trade: result.trade });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  // Success state
  if (successData) {
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
            <h2 className="mt-5 text-2xl font-bold text-charcoal">Thanks, {successData.full_name}!</h2>
            <p className="mt-3 text-lg leading-relaxed text-gray-600">
              We&rsquo;ll review your application and match you with contractors looking for{" "}
              <span className="font-semibold text-brand">{successData.trade}</span> apprentices.
              Expect to hear from us within 48 hours.
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
            Apply as an Apprentice
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-gray-600">
            Tell us about yourself and we&rsquo;ll match you with contractors looking for apprentices in your trade.
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-gray-200/70 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Full name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-semibold text-charcoal">
                Full Name <span className="text-brand">*</span>
              </label>
              <input
                id="full_name"
                type="text"
                required
                value={form.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                placeholder="e.g. Maria Garcia"
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
                  placeholder="you@email.com"
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

            {/* Trade of Interest */}
            <div>
              <label htmlFor="trade" className="block text-sm font-semibold text-charcoal">
                Trade of Interest <span className="text-brand">*</span>
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

            {/* Years of Experience */}
            <div>
              <label htmlFor="experience" className="block text-sm font-semibold text-charcoal">
                Years of Experience
              </label>
              <select
                id="experience"
                value={form.experience}
                onChange={(e) => updateField("experience", e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                <option value="" disabled>
                  Select experience level...
                </option>
                {EXPERIENCE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            {/* Certifications / Credentials */}
            <div>
              <label htmlFor="certifications" className="block text-sm font-semibold text-charcoal">
                Certifications / Credentials
              </label>
              <textarea
                id="certifications"
                rows={3}
                value={form.certifications}
                onChange={(e) => updateField("certifications", e.target.value)}
                placeholder="List any relevant certifications, licenses, or training"
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

            {/* Why you're a good fit */}
            <div>
              <label htmlFor="personal_statement" className="block text-sm font-semibold text-charcoal">
                Why you&rsquo;re a good fit
              </label>
              <textarea
                id="personal_statement"
                rows={3}
                value={form.personal_statement}
                onChange={(e) => updateField("personal_statement", e.target.value)}
                placeholder="A short personal statement about why you want to join the trades"
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
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

export const Route = createFileRoute("/apply")({
  head: () => ({
    meta: [{ title: "Apply as an Apprentice — TradeLaunch" }],
  }),
  component: ApplyPage,
});
