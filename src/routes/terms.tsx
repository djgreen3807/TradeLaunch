import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

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
              TradeLaunch is an apprenticeship marketplace connecting contractors seeking skilled
              trades apprentices with individuals seeking apprenticeship opportunities. We facilitate
              connections but do not employ either party.
            </p>
          </LegalSection>

          <LegalSection title="3. User Eligibility and Account Responsibilities">
            <p>
              <strong>Contractors:</strong> Must be legitimate businesses or licensed tradespeople.
              Contractors are responsible for providing accurate job descriptions, complying with all
              applicable labor laws, and maintaining non-discriminatory hiring practices.
            </p>
            <p>
              <strong>Apprentices:</strong> Must be 18 years of age or older and legally eligible to
              work in their jurisdiction. Apprentices are responsible for providing truthful
              applications and responding to contractor communications in a timely manner.
            </p>
          </LegalSection>

          <LegalSection title="4. Payment Terms">
            <p>
              <strong>Background Check Fee:</strong> A non-refundable $49 fee is charged when a
              background check is initiated through our third-party provider (Checkr). This fee covers
              the cost of the check and is not refundable once processing has begun, regardless of the
              result.
            </p>
            <p>
              <strong>Pay-Per-Placement:</strong> A flat fee of $299 is charged per successful
              placement, defined as an apprentice completing at least 30 days on the job. No fee is
              charged if the placement is unsuccessful within the first 30 days.
            </p>
            <p>
              <strong>Monthly Pro:</strong> $149/month for unlimited postings and placements ($119/month
              when billed annually).
            </p>
            <p>All payments are processed securely through Stripe.</p>
          </LegalSection>

          <LegalSection title="5. No Guarantee">
            <p>
              TradeLaunch facilitates connections between contractors and apprentices but does not
              guarantee employment, placement, or hire outcomes. Use of the Marketplace does not ensure
              that any contractor will hire any apprentice, or that any apprentice will accept any
              position.
            </p>
          </LegalSection>

          <LegalSection title="6. Background Check Disclosure">
            <p>
              Background checks are conducted through Checkr, a third-party provider. Results are
              subject to Checkr&rsquo;s processes, timelines, and accuracy. TradeLaunch is not
              responsible for Checkr&rsquo;s determinations or any delays in the background check
              process.
            </p>
          </LegalSection>

          <LegalSection title="7. Limitation of Liability">
            <p>
              TradeLaunch is a connection platform only. We do not guarantee placement outcomes,
              apprentice performance, or contractor satisfaction. To the fullest extent permitted by
              law, TradeLaunch disclaims all warranties and limits liability to the amount of fees paid.
            </p>
          </LegalSection>

          <LegalSection title="8. Right to Suspend or Terminate">
            <p>
              TradeLaunch reserves the right to suspend or terminate any account at its sole discretion
              for violation of these terms, fraudulent activity, or any conduct that TradeLaunch deems
              harmful to the Marketplace or its users.
            </p>
          </LegalSection>

          <LegalSection title="9. Governing Law">
            <p>
              {/* TODO: Replace "[Your State]" with the actual governing state */}
              These terms are governed by the laws of the State of Tennessee.
            </p>
          </LegalSection>

          <LegalSection title="10. Changes to Terms">
            <p>
              We may update these terms from time to time. Material changes will be communicated via
              email or through the Marketplace. Your continued use of TradeLaunch after any changes
              constitutes acceptance of the updated terms.
            </p>
          </LegalSection>

          <LegalSection title="11. Contact">
            <p>
              Questions about these terms:{" "}
              <a href="mailto:info@tradelaunch.work" className="text-brand underline underline-offset-2 hover:text-brand-hover">
                info@tradelaunch.work
              </a>
            </p>
          </LegalSection>
        </div>
      </main>
      <Footer />
    </>
  );
}
