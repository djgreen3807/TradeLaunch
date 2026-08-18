import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/create-test-user")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json() as { email?: string; password?: string };
        const email = body.email || `e2e-test-${Date.now()}@tradelaunch.work`;
        const password = body.password || "TestPass123!";

        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
          return new Response(JSON.stringify({ error: "Missing Supabase config" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${serviceRoleKey}`,
              apikey: serviceRoleKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              password,
              email_confirm: true,
              app_metadata: { role: "contractor" },
              user_metadata: { email, email_verified: true },
            }),
          });
          const data = await res.json();
          if (res.ok) {
            return new Response(
              JSON.stringify({ ok: true, email, password, userId: data.id }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          }
          return new Response(
            JSON.stringify({ ok: false, error: data.msg || data.error || "create failed", raw: data }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return new Response(
            JSON.stringify({ error: msg }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
