import { createFileRoute } from "@tanstack/react-router";
import { sql } from "~/db";
import { ensureSchoolSchema } from "~/lib/school-schema";
import { notifyNewSchool } from "~/lib/email";

export const Route = createFileRoute("/api/school-apply")({
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

        const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

        const name = str(body.name);
        const website = str(body.website);
        const description = str(body.description);
        const logo_url = str(body.logo_url);
        const address = str(body.address);
        const city = str(body.city);
        const state = str(body.state);
        const zip = str(body.zip);
        const phone = str(body.phone);
        const contact_name = str(body.contact_name);
        const contact_email = str(body.contact_email);
        const trades = str(body.trades);
        const message = str(body.message);
        const student_count_raw = str(body.student_count_estimate);
        const student_count_estimate =
          student_count_raw === "" ? null : Number(student_count_raw);

        // Validate required fields
        const missing: string[] = [];
        if (!name) missing.push("name");
        if (!contact_name) missing.push("contact_name");
        if (!contact_email) missing.push("contact_email");
        if (!trades) missing.push("trades");
        if (!city) missing.push("city");
        if (!state) missing.push("state");

        if (missing.length > 0) {
          return new Response(
            JSON.stringify({
              error: `Required fields missing: ${missing.join(", ")}`,
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        // Basic email format check
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(contact_email)) {
          return new Response(
            JSON.stringify({ error: "A valid contact_email is required" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        try {
          const db = sql();
          await ensureSchoolSchema(db);

          const rows = (await db`
            INSERT INTO schools (
              name, website, description, logo_url, address, city, state, zip, phone,
              contact_name, contact_email, trades, student_count_estimate, message, status
            )
            VALUES (
              ${name}, ${website || null}, ${description || null}, ${logo_url || null},
              ${address || null}, ${city}, ${state}, ${zip || null}, ${phone || null},
              ${contact_name}, ${contact_email}, ${trades}, ${Number.isFinite(student_count_estimate) ? student_count_estimate : null}, ${message || null}, 'pending'
            )
            RETURNING id
          `) as { id: string }[];

          const id = rows[0]?.id;

          // Send email notification
          void notifyNewSchool({
            name,
            contact_name,
            contact_email,
            phone,
            trades,
            student_count_estimate: student_count_raw,
            city,
            state,
            description,
            message,
          }).catch(() => undefined);

          return new Response(
            JSON.stringify({ ok: true, id }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown database error";
          return new Response(
            JSON.stringify({ error: msg }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
