/**
 * Creates the `contractor_subscriptions` table in Neon (the team's Postgres).
 *
 * Run once: `bun scripts/create-contractor-subscriptions.ts`
 * (DATABASE_URL must be in the environment.)
 *
 * Note: `user_id` is intentionally a plain UUID with NO foreign key — it maps to
 * the Supabase auth user id, and auth.users lives in Supabase, not Neon, so a FK
 * would fail.
 */
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const db = neon(url);

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

console.log("contractor_subscriptions table ready");
