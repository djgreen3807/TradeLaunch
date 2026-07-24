import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";

export const Route = createFileRoute("/api/submit-contact")({
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

        const name = typeof body.name === "string" ? body.name.trim() : "";
        const email = typeof body.email === "string" ? body.email.trim() : "";
        const subject = typeof body.subject === "string" ? body.subject.trim() : "";
        const message = typeof body.message === "string" ? body.message.trim() : "";

        // Validate required fields
        const missing: string[] = [];
        if (!name) missing.push("Name");
        if (!email) missing.push("Email");
        if (!subject) missing.push("Subject");
        if (!message) missing.push("Message");

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
            CREATE TABLE IF NOT EXISTS contact_messages (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name TEXT NOT NULL,
              email TEXT NOT NULL,
              subject TEXT NOT NULL,
              message TEXT NOT NULL,
              created_at TIMESTAMPTZ DEFAULT NOW()
            )
          `;

          await db`
            INSERT INTO contact_messages (name, email, subject, message)
            VALUES (${name}, ${email}, ${subject}, ${message})
          `;

          return new Response(
            JSON.stringify({ success: true, name }),
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
