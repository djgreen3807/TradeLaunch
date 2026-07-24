import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
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

function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-charcoal sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-gray-400">Last Updated: July 2026</p>
        </div>

        <div className="rounded-2xl border border-gray-200/70 bg-white p-8 sm:p-10 shadow-sm">
          <LegalSection title="1. Information We Collect">
            <p>We collect information you provide directly:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Contact information (name, email, phone number)</li>
              <li>Professional information (trade specialty, certifications, work history, years of experience)</li>
              <li>Background check information (Social Security Number, date of birth) — collected only with explicit consent for verification purposes</li>
              <li>Application details including location, personal statements, and job preferences</li>
            </ul>
          </LegalSection>

          <LegalSection title="2. How We Use Your Information">
            <p>Your information is used to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Match contractors with qualified apprentices</li>
              <li>Conduct background checks and credential verification (with your consent)</li>
              <li>Communicate with you about your application or posting</li>
              <li>Improve and operate the Marketplace</li>
              <li>Comply with legal obligations</li>
            </ul>
          </LegalSection>

          <LegalSection title="3. Data Storage &amp; Security">
            <p>
              Your data is stored on Neon (serverless Postgres) with encryption at rest and in transit.
              We implement reasonable security measures to protect your personal information. Background
              check data is transmitted securely to our verification partner (Checkr) and is not stored
              beyond what is necessary for the verification process.
            </p>
          </LegalSection>

          <LegalSection title="4. Data Sharing">
            <p>We share your information only:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>With contractors or apprentices as part of the matching process (limited to professional information, not SSN/DOB)</li>
              <li>With Checkr for background verification (only with explicit consent)</li>
              <li>With service providers who assist in operating the Marketplace (Stripe for payments)</li>
              <li>As required by law</li>
            </ul>
          </LegalSection>

          <LegalSection title="5. Your Rights">
            <p>You may:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Request access to your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data (subject to legal retention requirements)</li>
              <li>Withdraw consent for background check processing</li>
            </ul>
            <p>
              Contact{" "}
              <a href="mailto:hello@tradelaunch.com" className="text-brand underline underline-offset-2 hover:text-brand-hover">
                hello@tradelaunch.com
              </a>{" "}
              to exercise these rights.
            </p>
          </LegalSection>

          <LegalSection title="6. Cookies">
            <p>
              We use essential cookies for site functionality. We do not currently use tracking or
              advertising cookies.
            </p>
          </LegalSection>

          <LegalSection title="7. Changes to This Policy">
            <p>
              We will notify users of material changes to this privacy policy via email or through the
              Marketplace.
            </p>
          </LegalSection>

          <LegalSection title="8. Contact">
            <p>
              Privacy questions:{" "}
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
