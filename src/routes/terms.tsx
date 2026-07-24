import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

/* ------------------------------------------------------------------ */
/*  Section components                                                 */
/* ------------------------------------------------------------------ */

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-gray-100 last:border-b-0 py-8 first:pt-0">
      <h2 className="text-xl font-semibold tracking-tight text-charcoal mb-4">{title}</h2>
      <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed space-y-3">
        {children}
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
            <a href="/terms" className="transition-colors hover:text-white">
              Terms of Service
            </a>
            <a href="/privacy" className="transition-colors hover:text-white">
              Privacy Policy
            </a>
            <a href="/background-check-consent" className="transition-colors hover:text-white">
              Background Check Consent
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
/*  Page                                                                */
/* ------------------------------------------------------------------ */

function TermsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-charcoal sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-gray-400">Last Updated: July 2026</p>
        </div>

        <div className="rounded-2xl border border-gray-200/70 bg-white p-8 sm:p-10 shadow-sm">
          <LegalSection title="1. Acceptance of Terms">
            <p>
              By accessing or using TradeLaunch (&ldquo;the Marketplace&rdquo;), you agree to be bound
              by these Terms of Service. If you do not agree, do not use the Marketplace.
            </p>
          </LegalSection>

          <LegalSection title="2. Description of Service">
            <p>
              TradeLaunch is a two-sided marketplace connecting contractors seeking skilled trades
              apprentices with individuals seeking apprenticeship opportunities. We provide a platform
              for posting job opportunities, submitting applications, and facilitating connections.
              TradeLaunch does not employ contractors or apprentices and is not responsible for the
              terms of any employment or apprenticeship relationship formed through the platform.
            </p>
          </LegalSection>

          <LegalSection title="3. Contractor Responsibilities">
            <p>
              Contractors posting apprenticeship opportunities agree to: (a) provide accurate and
              complete information about the role; (b) comply with all applicable labor laws, safety
              regulations, and apprenticeship requirements; (c) not discriminate against applicants on
              any basis prohibited by law; (d) pay the applicable placement fee upon successful hire as
              defined in the pricing terms.
            </p>
          </LegalSection>

          <LegalSection title="4. Apprentice Responsibilities">
            <p>
              Apprentices applying through TradeLaunch agree to: (a) provide truthful and accurate
              information about their qualifications, experience, and credentials; (b) consent to
              background checks as part of the verification process; (c) respond to contractor
              communications in a timely manner.
            </p>
          </LegalSection>

          <LegalSection title="5. Payment Terms">
            <p>
              <strong>Pay-Per-Placement:</strong> A flat fee of $299 is charged per successful
              placement (defined as an apprentice completing at least 30 days on the job). No fee is
              charged if the placement is unsuccessful within the first 30 days.
            </p>
            <p>
              <strong>Monthly Unlimited:</strong> $149/month for unlimited postings and placements.
            </p>
            <p>
              <strong>Enterprise:</strong> Pricing is customized per organization.
            </p>
            <p>All payments are processed securely through Stripe.</p>
          </LegalSection>

          <LegalSection title="6. Limitation of Liability">
            <p>
              TradeLaunch is a connection platform only. We do not guarantee placement outcomes,
              apprentice performance, or contractor satisfaction. To the fullest extent permitted by
              law, TradeLaunch disclaims all warranties and limits liability to the amount of fees paid.
            </p>
          </LegalSection>

          <LegalSection title="7. Termination">
            <p>
              Either party may terminate use of the Marketplace at any time. TradeLaunch reserves the
              right to suspend or terminate accounts for violation of these terms.
            </p>
          </LegalSection>

          <LegalSection title="8. Governing Law">
            <p>These terms are governed by the laws of the State of Delaware.</p>
          </LegalSection>

          <LegalSection title="9. Contact">
            <p>
              Questions about these terms:{" "}
              <a href="mailto:hello@tradelaunch.com" className="text-brand underline underline-offset-2 hover:text-brand-hover">
                hello@tradelaunch.com
              </a>
            </p>
          </LegalSection>
        </div>
      </main>
      <Footer />
    </>
  );
}
