import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";

/**
 * Pay-Per-Placement (Step B, cont.): persists the saved card after
 * confirmCardSetup() succeeds, and marks the contractor's plan as
 * pay_per_placement/active so the /post-job gate opens.
 *
 * Plain fetch file-route endpoint (bypasses TanStack createServerFn arg-drop).
 */
export const Route = createFileRoute("/api/save-payment-method")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          userId?: string;
          customerId?: string;
          paymentMethodId?: string;
        };
        const { userId, customerId, paymentMethodId } = body;

        if (!userId || !customerId || !paymentMethodId) {
          return new Response(
            JSON.stringify({ error: "Missing userId, customerId, or paymentMethodId" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        try {
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

          return new Response(
            JSON.stringify({ ok: true }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[API-SAVE-PAYMENT-METHOD] ERROR:", msg);
          return new Response(
            JSON.stringify({ error: msg }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
