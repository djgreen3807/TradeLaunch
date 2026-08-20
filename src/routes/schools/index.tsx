import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { TRADES } from "~/lib/trades";

export const Route = createFileRoute("/schools/")({
  head: () => ({
    meta: [
      {
        title: "TradeLaunch for Trade Schools | Connect Students With Opportunities",
      },
      {
        name: "description",
        content:
          "TradeLaunch helps trade schools and apprenticeship programs connect students with contractors and skilled-trade opportunities.",
      },
    ],
  }),
  component: SchoolsPage,
});

/* ------------------------------------------------------------------ */
/*  Inline SVG icons (lightweight, no dependency)                      */
/* ------------------------------------------------------------------ */

function IconProfile({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function IconConnect({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function IconTrack({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function IconFree({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Sections                                                           */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: IconProfile,
    title: "Build a Professional Profile",
    desc: "Students create a profile showcasing their skills, training, and certifications — ready for contractors.",
  },
  {
    icon: IconConnect,
    title: "Connect With Contractors",
    desc: "Students get matched with contractors looking for the next generation of skilled tradespeople.",
  },
  {
    icon: IconTrack,
    title: "Track Student Participation",
    desc: "Your school can track how students engage with opportunities across the TradeLaunch marketplace.",
  },
  {
    icon: IconFree,
    title: "Free for Schools",
    desc: "Partnering with TradeLaunch is completely free for schools and students. No setup or subscription costs.",
  },
];

const STEPS = [
  {
    num: 1,
    title: "School Partners With TradeLaunch",
    desc: "Submit a short partnership request. Our team reviews it, approves your school, and sends you a unique link and QR code.",
  },
  {
    num: 2,
    title: "Students Create Their Profiles",
    desc: "Share your unique link or QR code with students. They register through it and are automatically associated with your school.",
  },
  {
    num: 3,
    title: "Students Connect With Opportunities",
    desc: "Students browse and connect with contractor roles, earning while they learn in a structured apprenticeship.",
  },
];

function SchoolsHero() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 sm:pb-28 lg:px-8 lg:pt-32">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center rounded-full border border-brand/30 bg-brand-light px-4 py-1.5 text-xs font-semibold tracking-wide text-brand">
          Trade School &amp; Apprenticeship Program Partners
        </span>

        <h1 className="mt-6 text-4xl font-bold tracking-tight text-charcoal sm:text-5xl lg:text-6xl">
          Connect Your Students With Their Next Opportunity
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
          TradeLaunch helps trade schools and apprenticeship programs connect their students with
          contractors looking for the next generation of skilled tradespeople.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <a
            href="/schools/apply"
            className="inline-flex rounded-xl bg-brand px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-brand-hover hover:shadow-lg"
          >
            Become a School Partner
          </a>
          <a
            href="/login"
            className="inline-flex rounded-xl border-2 border-brand bg-transparent px-8 py-3.5 text-base font-semibold text-brand transition-all hover:bg-brand-light"
          >
            School Sign In
          </a>
        </div>
      </div>
    </section>
  );
}

function WhySection() {
  return (
    <section id="why-tradelaunch" className="scroll-mt-20 bg-warm-cream">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">
            Give Your Students Another Path Into the Trades
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            A focused, free way to open doors for the next generation of skilled tradespeople.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

function TradesSection() {
  return (
    <section id="trades" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">
            Trades Supported
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            We connect students across the skilled trades that build and sustain our communities.
          </p>
        </div>

        <div className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-3">
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

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-warm-cream">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            Getting your students connected to real opportunities takes just three steps.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step) => (
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

function ClosingCTA() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">
          Partner With TradeLaunch
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-gray-600">
          It&rsquo;s free for schools and students. Give your students a direct path into the
          skilled trades.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <a
            href="/schools/apply"
            className="inline-flex rounded-xl bg-brand px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-brand-hover hover:shadow-lg"
          >
            Become a School Partner
          </a>
          <a
            href="/apply"
            className="inline-flex rounded-xl border-2 border-brand bg-transparent px-8 py-3.5 text-base font-semibold text-brand transition-all hover:bg-brand-light"
          >
            I&rsquo;m a Student
          </a>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function SchoolsPage() {
  return (
    <>
      <Header />
      <SchoolsHero />
      <WhySection />
      <TradesSection />
      <HowItWorks />
      <ClosingCTA />
      <Footer />
    </>
  );
}
