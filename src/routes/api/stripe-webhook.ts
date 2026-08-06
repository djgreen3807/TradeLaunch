import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";
import { stripe } from "~/lib/stripe";

export const Route = createFileRoute("/api/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const sig = request.headers.get("stripe-signature");
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

        let event: import("stripe").Stripe.Event;
        try {
          // Must verify against the RAW body — never request.json() here, or
          // signature verification will fail.
          const body = await request.text();
          event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Invalid signature";
          return new Response(`Webhook Error: ${message}`, { status: 400 });
        }

        const db = sql();

        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object;
            const userId = session.client_reference_id;
            console.log("[WEBHOOK] checkout.session.completed — user:", userId, "subscription:", session.subscription);
            if (userId && session.subscription) {
              const sub = await stripe.subscriptions.retrieve(
                session.subscription as string,
              );
              const result = await db`
                INSERT INTO contractor_subscriptions (user_id, stripe_customer_id, plan_type, subscription_id, subscription_status)
                VALUES (${userId}, ${session.customer as string}, 'monthly_unlimited', ${session.subscription as string}, 'active')
                ON CONFLICT (user_id) DO UPDATE SET
                  stripe_customer_id = ${session.customer as string},
                  plan_type = 'monthly_unlimited',
                  subscription_id = ${session.subscription as string},
                  subscription_status = 'active',
                  updated_at = NOW()
                RETURNING user_id, plan_type, subscription_status
              `;
              console.log("[WEBHOOK] DB upsert result:", result[0]);
            } else {
              console.log("[WEBHOOK] Skipping — no userId or subscription");
            }
            break;
          }
          case "setup_intent.succeeded": {
            // Handled client-side already — no webhook action needed
            break;
          }
          case "customer.subscription.deleted":
          case "customer.subscription.updated": {
            const sub = event.data.object;
            // Find user by subscription_id and update status
            await db`
              UPDATE contractor_subscriptions
              SET subscription_status = ${sub.status}, updated_at = NOW()
              WHERE subscription_id = ${sub.id}
            `;
            break;
          }
          case "invoice.payment_failed": {
            const invoice = event.data.object;
            if (invoice.subscription) {
              await db`
                UPDATE contractor_subscriptions
                SET subscription_status = 'past_due', updated_at = NOW()
                WHERE subscription_id = ${invoice.subscription as string}
              `;
            }
            break;
          }
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 });
      },
    },
  },
});
