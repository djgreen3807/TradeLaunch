import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";
import { stripe } from "~/lib/stripe";

/**
 * Pay-Per-Placement (Step B): create (or reuse) a Stripe customer for the user
 * and create a SetupIntent so the frontend can collect + save a card without
 * charging it. Returns the client_secret for confirmCardSetup().
 *
 * Plain fetch file-route endpoint (bypasses TanStack createServerFn arg-drop).
 */
export const Route = createFileRoute("/api/create-setup-intent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { userId?: string };
        const { userId } = body;

        if (!userId) {
          return new Response(
            JSON.stringify({ error: "Missing userId" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        try {
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

          return new Response(
            JSON.stringify({ clientSecret: setupIntent.client_secret, customerId }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[API-CREATE-SETUP-INTENT] ERROR:", msg);
          return new Response(
            JSON.stringify({ error: msg }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
