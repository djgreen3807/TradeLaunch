import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

export const Route = createFileRoute("/background-check-consent")({
  component: BackgroundCheckConsentPage,
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

function BackgroundCheckConsentPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-charcoal sm:text-5xl">
            Background Check Disclosure and Authorization
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            FCRA-Compliant Disclosure &middot; Last Updated: July 2026
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200/70 bg-white p-8 sm:p-10 shadow-sm">
          <LegalSection title="Disclosure">
            <p>
              TradeLaunch may obtain a consumer report and/or investigative consumer report (commonly
              known as a &ldquo;background check&rdquo;) about you as part of the apprentice
              verification and matching process. These reports may include information about your
              criminal history, employment history, education, motor vehicle records, professional
              licenses, and other background information.
            </p>
          </LegalSection>

          <LegalSection title="Authorization">
            <p>
              By providing your Social Security Number and date of birth, you authorize TradeLaunch and
              its verification partner (Checkr, Inc.) to obtain such consumer reports and to share the
              results with contractors considering you for apprenticeship opportunities. You understand
              that this authorization is valid for the duration of your apprenticeship search through
              TradeLaunch.
            </p>
          </LegalSection>

          <LegalSection title="Your Rights Under the FCRA">
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Request a copy of any consumer report obtained about you</li>
              <li>Dispute the accuracy or completeness of any information in the report</li>
              <li>Receive a summary of your rights under the Fair Credit Reporting Act</li>
            </ul>
            <p>
              If any adverse action is taken based on information in a consumer report, you will be
              provided with a copy of the report and a summary of your rights.
            </p>
          </LegalSection>

          <LegalSection title="State-Specific Notices">
            <p>
              <strong>California residents:</strong> You have additional rights under the California
              Investigative Consumer Reporting Agencies Act.
            </p>
            <p>
              <strong>New York residents:</strong> You have the right to inspect and receive a copy of
              any investigative consumer report. If you would like a copy of the report, check the box
              below.
            </p>
          </LegalSection>

          <LegalSection title="Acknowledgment">
            <p>
              I acknowledge that I have read and understand this disclosure and authorization. I
              authorize TradeLaunch to obtain consumer reports about me for apprenticeship matching
              purposes.
            </p>
          </LegalSection>
        </div>
      </main>
      <Footer />
    </>
  );
}
