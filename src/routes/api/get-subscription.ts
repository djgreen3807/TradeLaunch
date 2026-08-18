import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";

export const Route = createFileRoute("/api/get-subscription")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json() as { userId?: string };
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
            SELECT user_id, stripe_customer_id, plan_type, payment_method_id, subscription_id, subscription_status
            FROM contractor_subscriptions
            WHERE user_id = ${userId}
          `;
          const row = rows[0] as Record<string, unknown> | undefined;
          console.log("[API-GET-SUB] userId:", userId, "found:", !!row, "plan_type:", row?.plan_type, "status:", row?.subscription_status);

          if (!row) {
            return new Response(
              JSON.stringify({ sub: null }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          }

          return new Response(
            JSON.stringify({
              sub: {
                user_id: String(row.user_id),
                stripe_customer_id: (row.stripe_customer_id as string | null) ?? null,
                plan_type: (row.plan_type as string | null) ?? null,
                payment_method_id: (row.payment_method_id as string | null) ?? null,
                subscription_id: (row.subscription_id as string | null) ?? null,
                subscription_status: (row.subscription_status as string | null) ?? null,
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[API-GET-SUB] ERROR:", msg);
          return new Response(
            JSON.stringify({ error: msg }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
