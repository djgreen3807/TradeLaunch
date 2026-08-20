import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { TRADES } from "~/lib/trades";

export const Route = createFileRoute("/schools/apply")({
  head: () => ({
    meta: [
      {
        title: "Become a School Partner | TradeLaunch",
      },
      {
        name: "description",
        content:
          "Apply to become a TradeLaunch School Partner and connect your trade school or apprenticeship program's students with contractor opportunities.",
      },
    ],
  }),
  component: SchoolApplyPage,
});

interface FormData {
  name: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  contact_name: string;
  contact_email: string;
  phone: string;
  student_count_estimate: string;
  description: string;
  message: string;
}

const EMPTY_FORM: FormData = {
  name: "",
  website: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  contact_name: "",
  contact_email: "",
  phone: "",
  student_count_estimate: "",
  description: "",
  message: "",
};

function SchoolApplyPage() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleTrade(trade: string) {
    setSelectedTrades((prev) =>
      prev.includes(trade) ? prev.filter((t) => t !== trade) : [...prev, trade],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Client-side validation of required fields
    const required: Array<[keyof FormData, string]> = [
      ["name", "School name"],
      ["city", "City"],
      ["state", "State"],
      ["contact_name", "Administrator/contact name"],
      ["contact_email", "Contact email"],
    ];

    for (const [field, label] of required) {
      if (!form[field].trim()) {
        setError(`Please fill in the ${label}.`);
        return;
      }
    }

    if (selectedTrades.length === 0) {
      setError("Please select at least one trade or program offered.");
      return;
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(form.contact_email.trim())) {
      setError("Please enter a valid contact email.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      website: form.website.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      zip: form.zip.trim(),
      contact_name: form.contact_name.trim(),
      contact_email: form.contact_email.trim(),
      phone: form.phone.trim(),
      trades: selectedTrades.join(", "),
      student_count_estimate: form.student_count_estimate.trim(),
      description: form.description.trim(),
      message: form.message.trim(),
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/school-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.error) {
        setError(result.error || "Something went wrong. Please try again.");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="rounded-2xl border border-gray-200/70 bg-white p-8 text-center shadow-sm sm:p-12">
            <span className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-green-100 text-green-700">
              <svg
                className="size-8"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">
              Thank you!
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-gray-600">
              Your School Partner request has been received. TradeLaunch will review your request
              and reach out to the contact you provided.
            </p>
            <a
              href="/schools"
              className="mt-8 inline-flex rounded-xl bg-brand px-8 py-3 text-base font-semibold text-white shadow-md transition-all hover:bg-brand-hover"
            >
              Back to School Partner Info
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
            Become a School Partner
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-gray-600">
            Tell us about your school or apprenticeship program and we&rsquo;ll set your students
            up to connect with contractors.
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-gray-200/70 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* School name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-charcoal">
                School name <span className="text-brand">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Denver Technical College"
                className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-sm font-semibold text-charcoal">
                School website <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="website"
                type="url"
                value={form.website}
                onChange={(e) => updateField("website", e.target.value)}
                placeholder="https://example.edu"
                className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-charcoal">
                School address <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="address"
                type="text"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Street address"
                className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* City + State row */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="city" className="block text-sm font-semibold text-charcoal">
                  City <span className="text-brand">*</span>
                </label>
                <input
                  id="city"
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="e.g. Denver"
                  className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-semibold text-charcoal">
                  State <span className="text-brand">*</span>
                </label>
                <input
                  id="state"
                  type="text"
                  required
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  placeholder="e.g. CO"
                  className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </div>

            {/* ZIP */}
            <div>
              <label htmlFor="zip" className="block text-sm font-semibold text-charcoal">
                ZIP <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="zip"
                type="text"
                value={form.zip}
                onChange={(e) => updateField("zip", e.target.value)}
                placeholder="e.g. 80202"
                className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Contact name */}
            <div>
              <label htmlFor="contact_name" className="block text-sm font-semibold text-charcoal">
                Administrator/contact name <span className="text-brand">*</span>
              </label>
              <input
                id="contact_name"
                type="text"
                required
                value={form.contact_name}
                onChange={(e) => updateField("contact_name", e.target.value)}
                placeholder="e.g. Jordan Smith"
                className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Contact email + Phone row */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="contact_email" className="block text-sm font-semibold text-charcoal">
                  Contact email <span className="text-brand">*</span>
                </label>
                <input
                  id="contact_email"
                  type="email"
                  required
                  value={form.contact_email}
                  onChange={(e) => updateField("contact_email", e.target.value)}
                  placeholder="you@school.edu"
                  className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-charcoal">
                  Contact phone <span className="text-gray-400 font-normal">(optional)</span>
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

            {/* Trades offered */}
            <div>
              <span className="block text-sm font-semibold text-charcoal">
                Trades/programs offered <span className="text-brand">*</span>
              </span>
              <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                {TRADES.map((trade) => (
                  <label
                    key={trade}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                      selectedTrades.includes(trade)
                        ? "border-brand/40 bg-brand-light text-brand"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTrades.includes(trade)}
                      onChange={() => toggleTrade(trade)}
                      className="size-4 rounded border-gray-300 text-brand focus:ring-brand"
                    />
                    <span className="font-medium">{trade}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-400">Select all that apply.</p>
            </div>

            {/* Student count */}
            <div>
              <label htmlFor="student_count_estimate" className="block text-sm font-semibold text-charcoal">
                Approximate number of students{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="student_count_estimate"
                type="number"
                min="0"
                step="1"
                value={form.student_count_estimate}
                onChange={(e) => updateField("student_count_estimate", e.target.value)}
                placeholder="e.g. 250"
                className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-charcoal">
                School description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="A short description of your school or program"
                className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-charcoal shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Optional message */}
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-charcoal">
                Optional message <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="message"
                rows={3}
                value={form.message}
                onChange={(e) => updateField("message", e.target.value)}
                placeholder="Anything else you'd like us to know"
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
              {submitting ? "Submitting..." : "Submit School Partnership Request"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
