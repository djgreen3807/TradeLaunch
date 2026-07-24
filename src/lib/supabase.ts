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
 */
function getProjectRef(): string {
  // The anon key JWT lives in SUPABASE_SERVICE_ROLE_KEY (env naming is mixed)
  const anonKeyJwt = process.env.SUPABASE_SERVICE_ROLE_KEY;
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
  // Fallback: try SUPABASE_PROJECT_REF JWT
  const serviceJwt = process.env.SUPABASE_PROJECT_REF;
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
  throw new Error("Cannot determine Supabase project ref from environment");
}

function getSupabaseUrl(): string {
  // SUPABASE_URL env var currently holds a publishable key, not a URL
  const url = process.env.SUPABASE_URL;
  if (url && url.startsWith("http")) return url;
  const ref = getProjectRef();
  return `https://${ref}.supabase.co`;
}

function getSupabaseAnonKey(): string {
  // The actual anon key JWT is in SUPABASE_SERVICE_ROLE_KEY
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
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
 * Prevents crashes on Vercel preview deployments where env vars aren't set.
 */
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    return (getClient() as any)[prop];
  },
});
