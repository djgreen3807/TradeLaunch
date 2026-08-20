import { createFileRoute } from "@tanstack/react-router";
import { stripe } from "~/lib/stripe";

export const Route = createFileRoute("/api/create-checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json() as { userId?: string; origin?: string };
        const { userId, origin } = body;

        console.log("[API-CREATE-CHECKOUT] Received:", { userId, origin });

        if (!userId) {
          return new Response(
            JSON.stringify({ error: "Missing userId" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        let baseUrl = origin;
        if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
          baseUrl = "https://www.tradelaunch.work";
        }

        const successUrl = `${baseUrl}/post-job?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${baseUrl}/select-plan`;

        console.log("[API-CREATE-CHECKOUT] URLs:", { successUrl, cancelUrl });

        try {
          const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [{ price: "price_1U1TKhL0z9KENGAOYozgk5g6", quantity: 1 }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            client_reference_id: userId,
            metadata: { user_id: userId },
          });

          console.log("[API-CREATE-CHECKOUT] Session created:", session.id, "client_reference_id:", session.client_reference_id);

          if (!session.url) {
            throw new Error("Stripe did not return a checkout URL");
          }

          return new Response(
            JSON.stringify({ url: session.url }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[API-CREATE-CHECKOUT] ERROR:", msg);
          return new Response(
            JSON.stringify({ error: msg }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
