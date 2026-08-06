import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";
import { stripe } from "~/lib/stripe";

/* ------------------------------------------------------------------ */
/*  Types + shared helpers                                             */
/* ------------------------------------------------------------------ */

export interface ContractorSubscriptionRow {
  user_id: string;
  stripe_customer_id: string | null;
  plan_type: "pay_per_placement" | "monthly_unlimited" | null;
  payment_method_id: string | null;
  subscription_id: string | null;
  subscription_status: string | null;
}

/**
 * Mirrors the gate enforced in /api/submit-job: a contractor is allowed to post
 * when they have an active Monthly Unlimited subscription OR a saved card for
 * Pay-Per-Placement.
 */
export function hasActivePlan(sub: ContractorSubscriptionRow | null | undefined): boolean {
  if (!sub) return false;
  if (sub.plan_type === "monthly_unlimited" && sub.subscription_status === "active") {
    return true;
  }
  if (sub.plan_type === "pay_per_placement" && sub.payment_method_id !== null) {
    return true;
  }
  return false;
}

/* ------------------------------------------------------------------ */
/*  Server functions                                                   */
/* ------------------------------------------------------------------ */

/** Reads the contractor's subscription row (if any) from Neon. */
export const getContractorSubscription = createServerFn().handler(
  async ({ userId }: { userId: string }): Promise<{ sub: ContractorSubscriptionRow | null }> => {
    const db = sql();
    const rows = await db`
      SELECT user_id, stripe_customer_id, plan_type, payment_method_id, subscription_id, subscription_status
      FROM contractor_subscriptions
      WHERE user_id = ${userId}
    `;
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) return { sub: null };
    return {
      sub: {
        user_id: String(row.user_id),
        stripe_customer_id: (row.stripe_customer_id as string | null) ?? null,
        plan_type: (row.plan_type as ContractorSubscriptionRow["plan_type"]) ?? null,
        payment_method_id: (row.payment_method_id as string | null) ?? null,
        subscription_id: (row.subscription_id as string | null) ?? null,
        subscription_status: (row.subscription_status as string | null) ?? null,
      },
    };
  },
);

/**
 * Pay-Per-Placement (Step B): create (or reuse) a Stripe customer for the user
 * and create a SetupIntent so the frontend can collect + save a card without
 * charging it. Returns the client_secret for confirmCardSetup().
 */
export const createPayPerPlacementSetupIntent = createServerFn().handler(
  async ({ userId }: { userId: string }): Promise<{ clientSecret: string; customerId: string }> => {
    const db = sql();
    const rows = await db`
      SELECT stripe_customer_id FROM contractor_subscriptions WHERE user_id = ${userId}
    `;
    let customerId = (rows[0] as { stripe_customer_id?: string } | undefined)?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { user_id: userId },
      });
      customerId = customer.id;
      await db`
        INSERT INTO contractor_subscriptions (user_id, stripe_customer_id)
        VALUES (${userId}, ${customerId})
        ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = ${customerId}, updated_at = NOW()
      `;
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: { user_id: userId },
    });

    if (!setupIntent.client_secret) {
      throw new Error("Stripe did not return a client secret");
    }
    return { clientSecret: setupIntent.client_secret, customerId };
  },
);

/** Persists the saved card after confirmCardSetup() succeeds. */
export const savePayPerPlacementPaymentMethod = createServerFn().handler(
  async ({
    userId,
    customerId,
    paymentMethodId,
  }: {
    userId: string;
    customerId: string;
    paymentMethodId: string;
  }): Promise<{ ok: boolean }> => {
    const db = sql();
    await db`
      INSERT INTO contractor_subscriptions (user_id, stripe_customer_id, plan_type, payment_method_id, subscription_status)
      VALUES (${userId}, ${customerId}, 'pay_per_placement', ${paymentMethodId}, 'active')
      ON CONFLICT (user_id) DO UPDATE SET
        stripe_customer_id = ${customerId},
        plan_type = 'pay_per_placement',
        payment_method_id = ${paymentMethodId},
        subscription_status = 'active',
        subscription_id = NULL,
        updated_at = NOW()
    `;
    return { ok: true };
  },
);

/**
 * Monthly Unlimited (Step C): create a Stripe Checkout Session in subscription
 * mode. The frontend redirects the browser to the returned URL; Stripe handles
 * the hosted payment page. `origin` is the site's own origin (success/cancel
 * redirect targets) — passed from the client's window.location.origin.
 */
export const createMonthlyUnlimitedCheckout = createServerFn().handler(
  async ({ userId, origin }: { userId: string; origin: string }): Promise<{ url: string }> => {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: "price_1U1AdpL0z9KENGAOCUTqiwZQ", quantity: 1 }],
      success_url: `${origin}/post-job?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/select-plan`,
      client_reference_id: userId,
      metadata: { user_id: userId },
    });
    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }
    return { url: session.url };
  },
);

/**
 * Called when the contractor returns from Checkout with ?session_id=... in the
 * URL (also written by the webhook — this is the synchronous backstop so the
 * gate opens immediately). Verifies the session really belongs to this user and
 * that payment succeeded before unlocking /post-job.
 */
export const verifyCheckoutSession = createServerFn().handler(
  async ({
    sessionId,
    userId,
  }: {
    sessionId: string;
    userId: string;
  }): Promise<{ ok: boolean; status?: string }> => {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.client_reference_id !== userId) {
      return { ok: false };
    }
    const paid =
      session.payment_status === "paid" || session.payment_status === "no_payment_required";
    if (!paid || !session.subscription) {
      return { ok: false, status: session.payment_status ?? undefined };
    }
    const sub = await stripe.subscriptions.retrieve(session.subscription as string);
    const db = sql();
    await db`
      INSERT INTO contractor_subscriptions (user_id, stripe_customer_id, plan_type, subscription_id, subscription_status)
      VALUES (${userId}, ${session.customer as string}, 'monthly_unlimited', ${session.subscription as string}, ${sub.status})
      ON CONFLICT (user_id) DO UPDATE SET
        stripe_customer_id = ${session.customer as string},
        plan_type = 'monthly_unlimited',
        subscription_id = ${session.subscription as string},
        subscription_status = ${sub.status},
        updated_at = NOW()
    `;
    return { ok: true, status: sub.status };
  },
);
