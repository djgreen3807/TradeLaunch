/* ------------------------------------------------------------------ */
/*  Shared payment-plan types + helpers                                 */
/* ------------------------------------------------------------------ */
/*  NOTE: All server-side Stripe/db operations now live in plain       */
/*  /api/* file-route endpoints (see src/routes/api/*.ts). The old      */
/*  createServerFn wrappers were removed because TanStack Start's       */
/*  createServerFn().handler() silently drops function arguments.       */
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
