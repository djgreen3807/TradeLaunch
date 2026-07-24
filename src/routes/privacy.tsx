import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

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
              <li>Professional information (trade specialty, certifications, work history)</li>
              <li>
                For apprentices: Social Security Number, date of birth, and address history for
                background check purposes (collected only with explicit consent)
              </li>
              <li>Application details and job preferences</li>
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

          <LegalSection title="3. How Data is Stored">
            <p>
              Data is stored on Supabase with encryption at rest and in transit. Background check data
              is transmitted securely to Checkr and is not stored beyond what is necessary for the
              verification process.
            </p>
          </LegalSection>

          <LegalSection title="4. Third Parties">
            <p>We share your information only with the following third parties:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Checkr</strong> — for background checks, only with your explicit consent
              </li>
              <li>
                <strong>Stripe</strong> — for payment processing
              </li>
            </ul>
            <p>No data is sold to third parties.</p>
          </LegalSection>

          <LegalSection title="5. Data Retention">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Application data:</strong> Retained for 2 years from last activity
              </li>
              <li>
                <strong>Background check data:</strong> Retained only as long as necessary for the
                verification process
              </li>
              <li>Users may request earlier deletion of their data at any time</li>
            </ul>
          </LegalSection>

          <LegalSection title="6. Your Rights">
            <p>You may:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Request access to your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data (subject to legal retention requirements)</li>
              <li>Withdraw consent for background check processing</li>
            </ul>
            <p>
              Contact{" "}
              <a href="mailto:info@tradelaunch.work" className="text-brand underline underline-offset-2 hover:text-brand-hover">
                info@tradelaunch.work
              </a>{" "}
              to exercise these rights.
            </p>
          </LegalSection>

          <LegalSection title="7. Cookies">
            <p>
              We use essential cookies for site functionality. We do not currently use tracking or
              advertising cookies.
            </p>
          </LegalSection>

          <LegalSection title="8. Changes to This Policy">
            <p>
              We will notify users of material changes to this privacy policy via email or through the
              Marketplace.
            </p>
          </LegalSection>

          <LegalSection title="9. Contact">
            <p>
              Privacy questions:{" "}
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
