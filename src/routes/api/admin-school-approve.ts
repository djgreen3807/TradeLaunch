import { createFileRoute } from "@tanstack/react-router";
import { randomBytes } from "node:crypto";
import { sql } from "~/db";
import { ensureSchoolSchema } from "~/lib/school-schema";
import { requireAdmin } from "~/lib/admin-auth";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function generateReferralCode(): string {
  return randomBytes(6).toString("base64url");
}

export const Route = createFileRoute("/api/admin-school-approve")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

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
        if (!id || !UUID_RE.test(id)) {
          return new Response(JSON.stringify({ error: "Invalid school id" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const db = sql();
          await ensureSchoolSchema(db);

          const rows = (await db`
            SELECT id, name, status FROM schools WHERE id = ${id}
          `) as { id: string; name: string; status: string }[];

          const school = rows[0];
          if (!school) {
            return new Response(JSON.stringify({ error: "School not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (school.status !== "pending" && school.status !== "rejected") {
            return new Response(
              JSON.stringify({
                error: `School cannot be approved from status '${school.status}'`,
              }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          // Build a unique slug. Collisions with existing school slugs get
          // suffixed -2, -3, ... until unique.
          const existingSlugs = (await db`
            SELECT slug FROM schools WHERE slug IS NOT NULL
          `) as { slug: string }[];
          const used = new Set(existingSlugs.map((r) => r.slug));

          const baseSlug = slugify(school.name) || "school";
          let slug = baseSlug;
          let suffix = 2;
          while (used.has(slug)) {
            slug = `${baseSlug}-${suffix}`;
            suffix += 1;
          }

          // Build a unique referral code.
          const existingCodes = (await db`
            SELECT referral_code FROM schools WHERE referral_code IS NOT NULL
          `) as { referral_code: string }[];
          const codeUsed = new Set(existingCodes.map((r) => r.referral_code));
          let referralCode: string;
          do {
            referralCode = generateReferralCode();
          } while (codeUsed.has(referralCode));

          await db`
            UPDATE schools
            SET status = 'approved', slug = ${slug}, referral_code = ${referralCode},
                updated_at = NOW()
            WHERE id = ${id}
          `;

          return new Response(
            JSON.stringify({
              ok: true,
              slug,
              referral_code: referralCode,
              join_url: "/join/" + slug,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[API-ADMIN-APPROVE] ERROR:", msg);
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
