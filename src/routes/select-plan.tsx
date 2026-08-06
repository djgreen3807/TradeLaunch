import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { supabase } from "~/lib/supabase";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import {
  getContractorSubscription,
  hasActivePlan,
  createPayPerPlacementSetupIntent,
  savePayPerPlacementPaymentMethod,
  createMonthlyUnlimitedCheckout,
} from "~/lib/payment-server";

export const Route = createFileRoute("/select-plan")({
  component: SelectPlanPage,
});

/* ------------------------------------------------------------------ */
/*  Inline icons                                                       */
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
/*  Card form (Pay-Per-Placement)                                      */
/* ------------------------------------------------------------------ */

function CardForm({
  userId,
  onDone,
  onCancel,
}: {
  userId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError("");
    setSaving(true);
    try {
      // 1. Server-side: create a SetupIntent, return client_secret
      const { clientSecret, customerId } = await createPayPerPlacementSetupIntent({ userId });

      // 2. Frontend: confirm the card setup with Stripe Elements
      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: { name: "" },
          },
        },
      );

      if (confirmError) {
        setError(confirmError.message || "Could not save your card. Please try again.");
        setSaving(false);
        return;
      }

      // 3. Persist the payment method + plan
      const paymentMethodId = setupIntent.payment_method as string;
      await savePayPerPlacementPaymentMethod({ userId, customerId, paymentMethodId });
      onDone();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div className="rounded-xl border border-gray-300 bg-white px-4 py-3.5">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "15px",
                color: "#1c1917",
                "::placeholder": { color: "#a8a29e" },
              },
            },
          }}
        />
      </div>
      <p className="text-xs leading-relaxed text-gray-500">
        Test mode: use card number <span className="font-semibold text-gray-700">4242 4242 4242 4242</span>,
        any future date, any CVC. No real charge is made — you&rsquo;re only saving the card for the $299
        fee when you hire.
      </p>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving || !stripe}
          className="flex-1 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-hover hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving card..." : "Save card & continue"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Plan card                                                          */
/* ------------------------------------------------------------------ */

function PlanCard({
  name,
  price,
  priceLabel,
  description,
  features,
  highlighted,
  busy,
  onSelect,
  children,
}: {
  name: string;
  price: string;
  priceLabel: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  busy?: boolean;
  onSelect: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl p-8 ${
        highlighted
          ? "border-2 border-brand bg-warm-cream shadow-lg shadow-brand/10"
          : "border border-gray-200/60 bg-white shadow-sm"
      } transition-shadow hover:shadow-md`}
    >
      {highlighted && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-brand px-4 py-1 text-xs font-semibold tracking-wide text-white shadow-sm">
            Most Popular
          </span>
        </div>
      )}

      <h3 className="text-lg font-semibold text-charcoal">{name}</h3>
      <div className="mt-3 flex items-baseline gap-0.5">
        <span className="text-4xl font-bold tracking-tight text-charcoal">{price}</span>
        <span className="text-base font-medium text-gray-400">{priceLabel}</span>
      </div>
      <p className="mt-2 text-sm text-gray-500">{description}</p>

      <hr className="my-6 border-gray-200" />

      <ul className="flex-1 space-y-3.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
              <IconCheck className="size-3.5" />
            </span>
            <span className="text-sm leading-relaxed text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onSelect}
        disabled={busy}
        className={`mt-8 inline-flex w-full justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
          highlighted
            ? "bg-brand text-white shadow-md hover:bg-brand-hover hover:shadow-lg"
            : "border-2 border-brand bg-transparent text-brand hover:bg-brand-light"
        }`}
      >
        {busy ? "Please wait..." : "Select"}
      </button>

      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function SelectPlanPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate({ to: "/login" });
        return;
      }
      const id = data.session.user.id;
      if (cancelled) return;

      // Already has an active plan → straight to the form
      const { sub } = await getContractorSubscription({ userId: id });
      if (!cancelled) {
        if (hasActivePlan(sub)) {
          navigate({ to: "/post-job" });
          return;
        }
        setUserId(id);
        setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  function handleSelectPayPerPlacement() {
    setError("");
    setShowCardForm(true);
    if (!stripePromise) {
      const key = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
      if (!key) {
        setError("Payment is not configured. Please try again later.");
        return;
      }
      setStripePromise(loadStripe(key));
    }
  }

  async function handleSelectMonthlyUnlimited() {
    setError("");
    setCheckoutBusy(true);
    try {
      const { url } = await createMonthlyUnlimitedCheckout({
        userId: userId!,
        origin: window.location.origin,
      });
      window.location.href = url;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not start checkout. Please try again.";
      setError(message);
      setCheckoutBusy(false);
    }
  }

  if (checking) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-24 text-center">
          <p className="text-gray-500">Checking your account...</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">
            Choose your plan
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg leading-relaxed text-gray-600">
            Select a plan to start posting apprenticeships. No $5K&ndash;$8K placement
            fees — ever.
          </p>
          {error && (
            <div className="mx-auto mt-6 max-w-xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-2 sm:items-start">
          {/* Pay-Per-Placement */}
          <PlanCard
            name="Pay-Per-Placement"
            price="$299"
            priceLabel="on successful hire"
            description="Perfect for occasional hiring"
            features={[
              "One flat fee per successful hire",
              "Pre-vetted candidate matching",
              "No monthly commitment",
              "Pay only when you hire",
              "Full dashboard access",
            ]}
            onSelect={handleSelectPayPerPlacement}
          >
            {showCardForm && stripePromise && userId && (
              <Elements stripe={stripePromise}>
                <CardForm
                  userId={userId}
                  onDone={() => navigate({ to: "/post-job" })}
                  onCancel={() => setShowCardForm(false)}
                />
              </Elements>
            )}
          </PlanCard>

          {/* Monthly Unlimited */}
          <PlanCard
            name="Monthly Unlimited"
            price="$149"
            priceLabel="/month"
            description="Best for contractors hiring regularly"
            features={[
              "Unlimited job postings",
              "Unlimited placements",
              "Priority candidate matching",
              "Dedicated account manager",
              "Everything in Pay-Per-Placement",
            ]}
            highlighted
            busy={checkoutBusy}
            onSelect={handleSelectMonthlyUnlimited}
          >
            <p className="mt-4 text-xs leading-relaxed text-gray-500">
              You&rsquo;ll be redirected to Stripe&rsquo;s secure checkout to complete your
              subscription.
            </p>
          </PlanCard>
        </div>
      </main>
      <Footer />
    </>
  );
}
