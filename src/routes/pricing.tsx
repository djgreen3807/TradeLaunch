import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { ScrollReveal } from "~/components/ScrollReveal";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [{ title: "Pricing — TradeLaunch" }],
  }),
  component: Pricing,
});

/* ------------------------------------------------------------------ */
/*  Inline SVG icons                                                   */
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

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface PricingTier {
  name: string;
  price: string;
  priceLabel: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
}

const TIERS: PricingTier[] = [
  {
    name: "Pay-Per-Placement",
    price: "$999",
    priceLabel: "/placement",
    description: "Perfect for occasional hiring",
    features: [
      "One flat fee per successful hire",
      "Pre-vetted candidate matching",
      "No monthly commitment",
      "Pay only when you hire",
      "Full dashboard access",
    ],
    cta: "Post a Job",
    ctaHref: "/post-job",
  },
  {
    name: "Monthly Unlimited",
    price: "$299",
    priceLabel: "/month",
    description: "Best for contractors hiring regularly",
    features: [
      "Unlimited job postings",
      "Unlimited placements",
      "Priority candidate matching",
      "Dedicated account manager",
      "Everything in Pay-Per-Placement",
    ],
    cta: "Get Started",
    ctaHref: "/post-job",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    priceLabel: "",
    description: "For crews of 10+ or multi-location",
    features: [
      "Everything in Monthly Unlimited",
      "Bulk candidate vetting",
      "Custom onboarding & training tracks",
      "API access for your ATS/HRIS",
      "SLA & dedicated support team",
    ],
    cta: "Contact Us",
    ctaHref: "mailto:hello@tradelaunch.com",
  },
];

const FAQS = [
  {
    q: "Is there really no placement fee on Pay-Per-Placement?",
    a: "You only pay the $999 flat fee when you successfully hire through TradeLaunch. No hidden percentages or surprise invoices.",
  },
  {
    q: "Can I switch plans?",
    a: "Absolutely. Upgrade, downgrade, or cancel anytime. No long-term contracts.",
  },
  {
    q: "What counts as a 'successful placement'?",
    a: "An apprentice who completes at least 30 days on the job. If they don't work out, we replace them at no extra cost.",
  },
];

/* ------------------------------------------------------------------ */
/*  Section components                                                 */
/* ------------------------------------------------------------------ */

function PricingHeader() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 sm:pt-24 sm:pb-12 lg:px-8 lg:pt-28">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-charcoal sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
          No $5K–$8K placement fees. No hidden costs. Just a direct pipeline to qualified apprentices.
        </p>
      </div>
    </section>
  );
}

function PricingCard({ tier }: { tier: PricingTier }) {
  const isHighlighted = tier.highlighted;

  return (
    <div
      className={`relative flex flex-col rounded-2xl ${
        isHighlighted
          ? "scale-[1.02] border-2 border-brand bg-warm-cream shadow-lg shadow-brand/10"
          : "border border-gray-200/60 bg-white shadow-sm"
      } p-8 transition-shadow hover:shadow-md`}
    >
      {/* Most Popular badge */}
      {isHighlighted && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-brand px-4 py-1 text-xs font-semibold tracking-wide text-white shadow-sm">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-1">
        <h3 className="text-lg font-semibold text-charcoal">{tier.name}</h3>
      </div>

      {/* Price */}
      <div className="mt-3 flex items-baseline gap-0.5">
        <span className="text-4xl font-bold tracking-tight text-charcoal">{tier.price}</span>
        {tier.priceLabel && (
          <span className="text-base font-medium text-gray-400">{tier.priceLabel}</span>
        )}
      </div>

      {/* Description */}
      <p className="mt-2 text-sm text-gray-500">{tier.description}</p>

      {/* Divider */}
      <hr className="my-6 border-gray-200" />

      {/* Features */}
      <ul className="flex-1 space-y-3.5">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
              <IconCheck className="size-3.5" />
            </span>
            <span className="text-sm leading-relaxed text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <a
        href={tier.ctaHref}
        className={`mt-8 inline-flex w-full justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
          isHighlighted
            ? "bg-brand text-white shadow-md hover:bg-brand-hover hover:shadow-lg"
            : "border-2 border-brand bg-transparent text-brand hover:bg-brand-light"
        }`}
      >
        {tier.cta}
      </a>
    </div>
  );
}

function PricingCards() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:items-start">
        {TIERS.map((tier) => (
          <PricingCard key={tier.name} tier={tier} />
        ))}
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="border-t border-gray-200/70 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">
          Frequently asked questions
        </h2>

        <div className="mt-12 space-y-6">
          {FAQS.map((faq) => (
            <div
              key={faq.q}
              className="rounded-2xl border border-gray-200/60 bg-warm-cream p-6"
            >
              <h3 className="text-base font-semibold text-charcoal">{faq.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                              */
/* ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer className="border-t border-gray-200/70 bg-charcoal text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm">
            <a href="#" className="transition-colors hover:text-white">
              For Contractors
            </a>
            <a href="/post-job" className="transition-colors hover:text-white">
              Post a Job
            </a>
            <a href="/apply" className="transition-colors hover:text-white">
              Browse Jobs
            </a>
            <a href="mailto:hello@tradelaunch.com" className="transition-colors hover:text-white">
              Contact
            </a>
          </div>
          <p className="text-sm text-gray-500">© 2026 TradeLaunch</p>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Pricing page                                                        */
/* ------------------------------------------------------------------ */

function Pricing() {
  return (
    <>
      <Header />
      <ScrollReveal><PricingHeader /></ScrollReveal>
      <ScrollReveal delay={100}><PricingCards /></ScrollReveal>
      <ScrollReveal><Faq /></ScrollReveal>
      <Footer />
    </>
  );
}
