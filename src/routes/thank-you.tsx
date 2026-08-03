import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

export const Route = createFileRoute("/thank-you")({
  component: ThankYouPage,
});

function ThankYouPage() {
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
          <h2 className="mt-5 text-2xl font-bold text-charcoal">Thanks for applying!</h2>
          <p className="mt-3 text-lg leading-relaxed text-gray-600">
            We&rsquo;ll be in touch within 24 hours.
          </p>
          <a
            href="/"
            className="mt-8 inline-flex rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-hover"
          >
            Back to Homepage
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
