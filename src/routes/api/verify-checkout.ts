import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";
import { stripe } from "~/lib/stripe";

export const Route = createFileRoute("/api/verify-checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json() as { sessionId?: string; userId?: string };
        const { sessionId, userId } = body;

        console.log("[API-VERIFY] Received:", { sessionId, userId });

        if (!sessionId || !userId) {
          return new Response(
            JSON.stringify({ ok: false, error: `Missing fields: sessionId=${sessionId}, userId=${userId}` }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        try {
          const session = await stripe.checkout.sessions.retrieve(sessionId);
          console.log("[API-VERIFY] session.client_reference_id:", session.client_reference_id, "vs userId:", userId);
          console.log("[API-VERIFY] session.metadata:", session.metadata);
          if (session.client_reference_id !== userId) {
            return new Response(
              JSON.stringify({ ok: false, error: `Session does not belong to this user (session has: ${session.client_reference_id}, you are: ${userId})` }),
              { status: 403, headers: { "Content-Type": "application/json" } },
            );
          }

          const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";
          if (!paid || !session.subscription) {
            return new Response(
              JSON.stringify({ ok: false, status: session.payment_status ?? "unknown" }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
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

          return new Response(
            JSON.stringify({ ok: true, status: sub.status }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[API-VERIFY] ERROR:", msg);
          return new Response(
            JSON.stringify({ ok: false, error: msg }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
