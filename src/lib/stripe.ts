import Stripe from "stripe";

/**
 * Server-side Stripe client (test mode). `STRIPE_SECRET_KEY` is set in the
 * Vercel project environment (sk_test_...).
 *
 * Lazily initialized (like src/lib/supabase.ts) so importing this module never
 * crashes the server when the key is absent — only actual Stripe calls fail
 * with a clear error. Must only ever be imported from server code, never from
 * client components.
 */
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set — Stripe operations require the server-side secret key.",
    );
  }
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as any)[prop];
  },
});
