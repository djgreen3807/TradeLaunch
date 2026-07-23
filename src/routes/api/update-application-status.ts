import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";

export const Route = createFileRoute("/api/update-application-status")({
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

        const id = typeof body.id === "string" ? body.id.trim() : "";
        const status = typeof body.status === "string" ? body.status.trim() : "";

        if (!id) {
          return new Response(
            JSON.stringify({ error: "Missing application id" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        const validStatuses = ["new", "reviewed", "contacted"];
        if (!validStatuses.includes(status)) {
          return new Response(
            JSON.stringify({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        try {
          const db = sql();

          // Ensure the status column exists
          await db`
            ALTER TABLE apprentice_applications
            ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new'
          `;

          const result = await db`
            UPDATE apprentice_applications
            SET status = ${status}
            WHERE id = ${id}
          `;

          return new Response(
            JSON.stringify({ success: true, id, status }),
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
