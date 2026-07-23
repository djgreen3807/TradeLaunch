import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";

export const Route = createFileRoute("/api/submit-application")({
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

        const full_name = typeof body.full_name === "string" ? body.full_name.trim() : "";
        const email = typeof body.email === "string" ? body.email.trim() : "";
        const phone = typeof body.phone === "string" ? body.phone.trim() : "";
        const trade = typeof body.trade === "string" ? body.trade.trim() : "";
        const experience = typeof body.experience === "string" ? body.experience.trim() : "";
        const certifications = typeof body.certifications === "string" ? body.certifications.trim() : "";
        const location = typeof body.location === "string" ? body.location.trim() : "";
        const personal_statement = typeof body.personal_statement === "string" ? body.personal_statement.trim() : "";

        // Validate required fields
        const missing: string[] = [];
        if (!full_name) missing.push("Full name");
        if (!email) missing.push("Email");
        if (!trade) missing.push("Trade of interest");

        if (missing.length > 0) {
          return new Response(
            JSON.stringify({ error: `Required fields missing: ${missing.join(", ")}` }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        try {
          const db = sql();

          // Create table if it doesn't exist
          await db`
            CREATE TABLE IF NOT EXISTS apprentice_applications (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              full_name TEXT NOT NULL,
              email TEXT NOT NULL,
              phone TEXT,
              trade TEXT NOT NULL,
              experience TEXT,
              certifications TEXT,
              location TEXT,
              personal_statement TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW()
            )
          `;

          await db`
            INSERT INTO apprentice_applications (full_name, email, phone, trade, experience, certifications, location, personal_statement)
            VALUES (${full_name}, ${email}, ${phone || null}, ${trade}, ${experience || null}, ${certifications || null}, ${location || null}, ${personal_statement || null})
          `;

          return new Response(
            JSON.stringify({ success: true, full_name, trade }),
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
