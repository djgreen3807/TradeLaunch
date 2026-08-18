import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/fix-confirmation")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json() as { email?: string };
        const email = body.email;

        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
          return new Response(JSON.stringify({ error: "Missing Supabase config" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        // List-all mode when no email provided
        if (!email) {
          try {
            // Decode service role key JWT to see which project ref it belongs to
            let keyRef = "unknown";
            let keyRole = "unknown";
            try {
              const parts = serviceRoleKey.split(".");
              if (parts.length === 3) {
                const payload = JSON.parse(
                  Buffer.from(parts[1], "base64url").toString("utf8")
                );
                keyRef = payload.ref || "no-ref-claim";
                keyRole = payload.role || "no-role-claim";
              }
            } catch (e) {
              keyRef = "decode-error";
            }

            const res = await fetch(
              `${supabaseUrl}/auth/v1/admin/users?page=1&per_page=50`,
              {
                headers: {
                  Authorization: `Bearer ${serviceRoleKey}`,
                  apikey: serviceRoleKey,
                },
              }
            );
            const data = await res.json();
            const users = (data.users || []).map((u: any) => ({
              email: u.email,
              confirmed: u.email_confirmed_at,
              created: u.created_at,
              id: u.id,
            }));
            return new Response(
              JSON.stringify({
                ok: true,
                supabaseUrl,
                serviceRoleKeyRef: keyRef,
                serviceRoleKeyRole: keyRole,
                httpStatus: res.status,
                rawResponse: data,
                count: users.length,
                users,
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return new Response(
              JSON.stringify({ error: msg }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        }

        try {
          // Get user by email — list all and match locally (GoTrue filter syntax is unreliable)
          const usersRes = await fetch(
            `${supabaseUrl}/auth/v1/admin/users?page=1&per_page=200`,
            {
              headers: {
                Authorization: `Bearer ${serviceRoleKey}`,
                apikey: serviceRoleKey,
              },
            }
          );
          const usersData = await usersRes.json();
          const allUsers = usersData.users || [];
          const user = allUsers.find(
            (u: any) => (u.email || "").toLowerCase() === email.toLowerCase()
          );
          console.log("[FIX-CONFIRM] Total users:", allUsers.length, "matched:", !!user);

          if (!user) {
            return new Response(
              JSON.stringify({ error: "No user found with that email" }),
              { status: 404, headers: { "Content-Type": "application/json" } }
            );
          }

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
