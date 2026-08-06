import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";
import { notifyNewJobPosting } from "~/lib/email";

export const Route = createFileRoute("/api/submit-job")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Record<string, unknown>;
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const company_name = typeof body.company_name === "string" ? body.company_name.trim() : "";
        const contact_name = typeof body.contact_name === "string" ? body.contact_name.trim() : "";
        const email = typeof body.email === "string" ? body.email.trim() : "";
        const trade = typeof body.trade === "string" ? body.trade.trim() : "";
        const description = typeof body.description === "string" ? body.description.trim() : "";
        const phone = typeof body.phone === "string" ? body.phone.trim() : "";
        const location = typeof body.location === "string" ? body.location.trim() : "";
        const budget = typeof body.budget === "string" ? body.budget.trim() : "";
        const contractor_id = typeof body.contractor_id === "string" ? body.contractor_id.trim() : null;

        // Validate required fields
        const missing: string[] = [];
        if (!company_name) missing.push("Company name");
        if (!contact_name) missing.push("Contact name");
        if (!email) missing.push("Email");
        if (!trade) missing.push("Trade specialty");
        if (!description) missing.push("Job description");

        if (missing.length > 0) {
          return new Response(
            JSON.stringify({ error: `Required fields missing: ${missing.join(", ")}` }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        // ------------------------------------------------------------------
        // Payment gate: contractors must have an active plan (Monthly
        // Unlimited subscription) or a saved card (Pay-Per-Placement) before
        // they can submit a job posting.
        // ------------------------------------------------------------------
        const db = sql();
        if (!contractor_id) {
          return new Response(
            JSON.stringify({
              error: "PAYMENT_REQUIRED",
              message: "Please select a plan before posting a job.",
            }),
            { status: 402, headers: { "Content-Type": "application/json" } },
          );
        }

        const sub = await db`
          SELECT plan_type, subscription_status, payment_method_id
          FROM contractor_subscriptions
          WHERE user_id = ${contractor_id}
        `;

        const hasActivePlan =
          sub.length > 0 &&
          ((sub[0].plan_type === "monthly_unlimited" && sub[0].subscription_status === "active") ||
            (sub[0].plan_type === "pay_per_placement" && sub[0].payment_method_id !== null));

        if (!hasActivePlan) {
          return new Response(
            JSON.stringify({
              error: "PAYMENT_REQUIRED",
              message: "No active plan. Please select a plan first.",
            }),
            { status: 402, headers: { "Content-Type": "application/json" } },
          );
        }

        try {
          // Ensure contractor_id column exists
          await db`
            ALTER TABLE job_postings
            ADD COLUMN IF NOT EXISTS contractor_id UUID
          `;

          await db`
            INSERT INTO job_postings (company_name, contact_name, email, phone, trade, description, location, budget, contractor_id)
            VALUES (${company_name}, ${contact_name}, ${email}, ${
              phone || null
            }, ${trade}, ${description}, ${location || null}, ${
              budget || null
            }, ${contractor_id || null})
          `;

          const nameParts = contact_name.split(/\s+/);
          const first_name = nameParts[0] || null;
          const last_name = nameParts.slice(1).join(" ") || null;
          void db`
            INSERT INTO apprenticeship_leads (type, first_name, last_name, email, phone, trade, company_name, message, location, budget, contractor_id)
            VALUES ('contractor', ${first_name}, ${last_name}, ${email}, ${phone || null}, ${trade}, ${company_name}, ${description}, ${location || null}, ${budget || null}, ${contractor_id || null})
          `.catch(() => undefined);

          // Send email notification
          await notifyNewJobPosting({
            company_name,
            contact_name,
            email,
            phone,
            trade,
            description,
            location,
            budget,
          });

          return new Response(
            JSON.stringify({ success: true, contact_name, contractor_id: contractor_id || null }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown database error";
          return new Response(
            JSON.stringify({ error: message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
