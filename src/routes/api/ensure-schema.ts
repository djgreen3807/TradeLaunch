import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";

export const Route = createFileRoute("/api/ensure-schema")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const db = sql();

          await db`
            CREATE TABLE IF NOT EXISTS contractor_subscriptions (
              user_id UUID PRIMARY KEY,
              stripe_customer_id TEXT,
              plan_type TEXT CHECK (plan_type IN ('pay_per_placement', 'monthly_unlimited')),
              payment_method_id TEXT,
              subscription_id TEXT,
              subscription_status TEXT DEFAULT 'inactive',
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            )
          `;

          await db`
            CREATE TABLE IF NOT EXISTS job_postings (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              company_name TEXT NOT NULL,
              contact_name TEXT NOT NULL,
              email TEXT NOT NULL,
              phone TEXT,
              trade TEXT NOT NULL,
              description TEXT NOT NULL,
              location TEXT,
              budget TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW()
            )
          `;

          await db`
            ALTER TABLE job_postings
            ADD COLUMN IF NOT EXISTS contractor_id UUID
          `;

          const check = await db`
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name IN ('contractor_subscriptions', 'job_postings')
            ORDER BY table_name
          `;
          const tables = (check as any[]).map((r) => r.table_name);

          return new Response(
            JSON.stringify({ ok: true, tables }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[ENSURE-SCHEMA] ERROR:", msg);
          return new Response(
            JSON.stringify({ ok: false, error: msg }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
