import { neon } from "@neondatabase/serverless";
const db = neon(process.env.DATABASE_URL!);
const rows = await db`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'contractor_subscriptions' ORDER BY ordinal_position`;
console.log(JSON.stringify(rows, null, 1));
