import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "~/components/Header";

export const Route = createFileRoute("/")({
  component: Home,
});

/* ------------------------------------------------------------------ */
/*  Inline SVG icons (lightweight, no dependency)                      */
/* ------------------------------------------------------------------ */

function IconCheck({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconDollar({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function IconShield({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function IconUsers({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
  );
}

function IconClock({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function IconHandshake({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
    </svg>
  );
}

function IconRocket({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: IconDollar,
    title: "Cut hiring costs",
    desc: "No $5K–$8K placement fees. Pay a flat, transparent rate that saves thousands per hire.",
  },
  {
    icon: IconShield,
    title: "Vetted candidates only",
    desc: "Every apprentice is credential-checked, background-screened, and skills-assessed before they reach you.",
  },
  {
    icon: IconUsers,
    title: "Retention tools built in",
    desc: "Milestone tracking, mentorship prompts, and progress dashboards keep apprentices engaged and reduce churn.",
  },
  {
    icon: IconClock,
    title: "Fast placement",
    desc: "Most roles are matched within days, not weeks — because our pipeline is pre-qualified and ready.",
  },
  {
    icon: IconHandshake,
    title: "No commitment",
    desc: "Post a role at no upfront cost. You only pay when you hire. No retainers, no long-term contracts.",
  },
  {
    icon: IconRocket,
    title: "Career-path apprentices",
    desc: "Our apprentices aren't just labor — they're building careers. Structured pathways mean better attitudes and lower turnover.",
  },
];

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
];

/* ------------------------------------------------------------------ */
/*  Section components                                                 */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 sm:pb-28 lg:px-8 lg:pt-32">
      <div className="mx-auto max-w-3xl text-center">
        {/* Eyebrow */}
        <span className="inline-flex items-center rounded-full border border-brand/30 bg-brand-light px-4 py-1.5 text-xs font-semibold tracking-wide text-brand">
          Vetted · Structured · Paid
        </span>

        {/* Headline */}
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-charcoal sm:text-5xl lg:text-6xl">
          The apprenticeship marketplace built for trades.
        </h1>

        {/* Subhead */}
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
          Skip the $5K–$8K agency fees. TradeLaunch connects contractors directly with pre-vetted
          apprentices in electrical, plumbing, HVAC, welding, and more — backed by a model investors
          trust.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <div className="flex flex-col items-center gap-1.5">
            <a
              href="/post-job"
              className="inline-flex rounded-xl bg-brand px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-brand-hover hover:shadow-lg"
            >
              Post an Apprenticeship
            </a>
            <span className="text-xs text-gray-400">For contractors</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <a
              href="/apply"
              className="inline-flex rounded-xl border-2 border-brand bg-transparent px-8 py-3.5 text-base font-semibold text-brand transition-all hover:bg-brand-light"
            >
              Apply as an Apprentice
            </a>
            <span className="text-xs text-gray-400">For apprentices</span>
          </div>
        </div>

        {/* Micro-copy */}
        <p className="mt-6 text-sm text-gray-400">
          No placement fees for the first 30 days.{" "}
          <a href="mailto:hello@tradelaunch.com" className="font-medium text-brand underline underline-offset-2 hover:text-brand-hover">
            Talk to our team
          </a>
        </p>
      </div>
    </section>
  );
}

function StatsBar() {
  const stats = [
    { value: "77%", label: "of construction firms are hiring constrained", sub: "Contractors who can't fill open positions" },
    { value: "500K+", label: "industry-wide shortage driving urgent demand", sub: "New trades workers needed in 2026" },
    { value: "$5K–$8K", label: "per hire, before onboarding costs", sub: "Average agency placement fee" },
  ];

  return (
    <section className="border-y border-gray-200/70 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3 sm:gap-4">
          {stats.map((s, i) => (
            <div
              key={i}
              className={`flex flex-col items-center text-center ${
                i < 2 ? "sm:border-r sm:border-gray-200" : ""
              } px-4`}
            >
              <span className="text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">{s.value}</span>
              <span className="mt-1.5 text-sm font-medium text-gray-700">{s.sub}</span>
              <span className="mt-0.5 text-xs text-gray-400">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      num: 1,
      title: "Contractors post a role",
      desc: "Describe trade specialty, working conditions, hours, and set your budget.",
    },
    {
      num: 2,
      title: "We pre-vet every applicant",
      desc: "We verify credentials, certifications, and work history so you don't have to.",
    },
    {
      num: 3,
      title: "Apprentices start earning",
      desc: "Matched apprentices begin paid on-the-job training, tracked in a shared dashboard.",
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-20 bg-warm-cream">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">
            From posting to placement in days.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            No lengthy agency cycles. No bloated retainers. Just a direct pipeline from contractors
            to qualified apprentices ready to work.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.num}
              className="group relative rounded-2xl border border-gray-200/60 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="mb-5 flex size-12 items-center justify-center rounded-xl bg-brand-light text-xl font-bold text-brand">
                {step.num}
              </span>
              <h3 className="text-lg font-semibold text-charcoal">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-gray-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Trades() {
  return (
    <section id="trades" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">
            Every specialty. One marketplace.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            From one-person shops to 50-person crews, TradeLaunch covers the trades that build.
          </p>
        </div>

        {/* Value props */}
        <div className="mx-auto mt-12 grid max-w-3xl gap-3 sm:grid-cols-2">
          {[
            "Credential-verified candidates",
            "Structured earning-while-learning",
            "Background-checked & safety-trained",
            "Mentorship coordination tools",
          ].map((text) => (
            <div key={text} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-warm-gray/50 px-5 py-3.5">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                <IconCheck className="size-4" />
              </span>
              <span className="text-sm font-medium text-gray-700">{text}</span>
            </div>
          ))}
        </div>

        {/* Trade tags */}
        <div className="mx-auto mt-12 flex max-w-3xl flex-wrap justify-center gap-3">
          {TRADES.map((trade) => (
            <span
              key={trade}
              className="rounded-full border border-gray-200 bg-gray-50 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-brand/40 hover:bg-brand-light hover:text-brand"
            >
              {trade}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyContractors() {
  return (
    <section id="pricing" className="scroll-mt-20 bg-warm-cream">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">
            Why contractors choose TradeLaunch
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-200/60 bg-white p-7 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-brand-light text-brand">
                <f.icon className="size-5" />
              </span>
              <h3 className="text-base font-semibold text-charcoal">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">
          Ready to hire without the agency fee?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-gray-600">
          We match contractors with vetted, job-ready apprentices — without the $5K–$8K placement
          fees. Post your first role and see candidates in days.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <a
            href="/post-job"
            className="inline-flex rounded-xl bg-brand px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-brand-hover hover:shadow-lg"
          >
            Get Started
          </a>
          <a
            href="mailto:hello@tradelaunch.com"
            className="inline-flex rounded-xl border-2 border-brand bg-transparent px-8 py-3.5 text-base font-semibold text-brand transition-all hover:bg-brand-light"
          >
            Talk to Our Team
          </a>
        </div>

        <div className="mt-6 flex flex-col items-center gap-1 text-sm text-gray-400">
          <span>Response within 24 hours</span>
          <a href="mailto:hello@tradelaunch.com" className="font-medium text-brand hover:text-brand-hover">
            hello@tradelaunch.com
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-200/70 bg-charcoal text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Links */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm">
            <a href="#" className="transition-colors hover:text-white">
              For Contractors
            </a>
            <a
              href="/post-job"
              className="transition-colors hover:text-white"
            >
              Post a Job
            </a>
            <a
              href="/apply"
              className="transition-colors hover:text-white"
            >
              Browse Jobs
            </a>
            <a href="mailto:hello@tradelaunch.com" className="transition-colors hover:text-white">
              Contact
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-gray-500">© 2026 TradeLaunch</p>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Home page                                                          */
/* ------------------------------------------------------------------ */

function Home() {
  return (
    <>
      <Header />
      <Hero />
      <StatsBar />
      <HowItWorks />
      <Trades />
      <WhyContractors />
      <ClosingCTA />
      <Footer />
    </>
  );
}
