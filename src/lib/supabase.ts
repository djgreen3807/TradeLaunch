import { createClient } from "@supabase/supabase-js";

/**
 * Decode a base64 string (works in both Node.js and browser).
 */
function decodeBase64(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "base64").toString("utf-8");
  }
  // Browser fallback
  return decodeURIComponent(
    atob(str)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join(""),
  );
}

/**
 * Extract the Supabase project ref from an anon/service_role key JWT.
 * Tries server-side env vars first, then Vite-inlined client vars.
 */
function getProjectRef(): string {
  // Server-side: try SUPABASE_SERVICE_ROLE_KEY JWT
  const anonKeyJwt =
    typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY;
  if (anonKeyJwt) {
    try {
      const parts = anonKeyJwt.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(decodeBase64(parts[1]));
        if (payload.ref) return payload.ref;
      }
    } catch {
      // fall through
    }
  }
  // Server-side: try SUPABASE_PROJECT_REF JWT
  const serviceJwt =
    typeof process !== "undefined" && process.env?.SUPABASE_PROJECT_REF;
  if (serviceJwt) {
    try {
      const parts = serviceJwt.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(decodeBase64(parts[1]));
        if (payload.ref) return payload.ref;
      }
    } catch {
      // fall through
    }
  }
  // Client-side: extract from VITE_SUPABASE_URL
  const viteUrl =
    typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL;
  if (viteUrl && typeof viteUrl === "string") {
    const match = viteUrl.match(/https:\/\/(.+)\.supabase\.co/);
    if (match) return match[1];
  }
  throw new Error("Cannot determine Supabase project ref from environment");
}

function getSupabaseUrl(): string {
  // Client-side: use Vite-inlined URL
  const viteUrl =
    typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL;
  if (viteUrl && typeof viteUrl === "string") return viteUrl;

  // Server-side: try SUPABASE_URL directly
  const url =
    typeof process !== "undefined" && process.env?.SUPABASE_URL;
  if (url && typeof url === "string" && url.startsWith("http")) return url;

  // Server-side: construct from JWT
  const ref = getProjectRef();
  return `https://${ref}.supabase.co`;
}

function getSupabaseAnonKey(): string {
  // Client-side: use Vite-inlined anon key
  const viteKey =
    typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  if (viteKey && typeof viteKey === "string") return viteKey;

  // Server-side: the anon key JWT is in SUPABASE_SERVICE_ROLE_KEY
  const key =
    typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY;
  if (key) return key;

  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
}

let _client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!_client) {
    _client = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return _client;
}

/**
 * Lazy Supabase client — only initialized on first use, not at module load time.
 * Works in both SSR (process.env) and browser (import.meta.env.VITE_*).
 */
export { getSupabaseUrl, getSupabaseAnonKey };

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    return (getClient() as any)[prop];
  },
});
