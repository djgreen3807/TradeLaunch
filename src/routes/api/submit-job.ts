import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";

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

        try {
          const db = sql();
          await db`
            INSERT INTO job_postings (company_name, contact_name, email, phone, trade, description, location, budget)
            VALUES (${company_name}, ${contact_name}, ${email}, ${
              phone || null
            }, ${trade}, ${description}, ${location || null}, ${
              budget || null
            })
          `;
          return new Response(
            JSON.stringify({ success: true, contact_name }),
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
