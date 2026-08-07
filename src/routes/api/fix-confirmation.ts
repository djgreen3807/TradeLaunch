import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/fix-confirmation")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json() as { email?: string };
        const email = body.email;

        if (!email) {
          return new Response(JSON.stringify({ error: "Missing email" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
          return new Response(JSON.stringify({ error: "Missing Supabase config" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          // Get user by email
          const usersRes = await fetch(
            `${supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(`email.eq.${email}`)}`,
            {
              headers: {
                Authorization: `Bearer ${serviceRoleKey}`,
                apikey: serviceRoleKey,
              },
            }
          );
          const usersData = await usersRes.json();
          console.log("[FIX-CONFIRM] Users lookup:", JSON.stringify(usersData).slice(0, 500));

          if (!usersData.users || usersData.users.length === 0) {
            return new Response(
              JSON.stringify({ error: "No user found with that email" }),
              { status: 404, headers: { "Content-Type": "application/json" } }
            );
          }

          const user = usersData.users[0];

          // Generate a confirmation link
          const linkRes = await fetch(
            `${supabaseUrl}/auth/v1/admin/generate_link`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${serviceRoleKey}`,
                apikey: serviceRoleKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                type: "signup",
                email: user.email,
                options: {
                  redirect_to: "https://www.tradelaunch.work/login",
                },
              }),
            }
          );
          const linkData = await linkRes.json();
          console.log("[FIX-CONFIRM] Link generation:", JSON.stringify(linkData).slice(0, 1000));

          return new Response(
            JSON.stringify({
              ok: true,
              user_email: user.email,
              user_confirmed: user.email_confirmed_at,
              confirmation_link: linkData.properties?.action_link || linkData.action_link || null,
              raw: JSON.stringify(linkData).slice(0, 1000),
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[FIX-CONFIRM] ERROR:", msg);
          return new Response(
            JSON.stringify({ error: msg }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
