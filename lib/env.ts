const SUPABASE_PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function requiredEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function hasSupabasePublicEnv() {
  return Boolean(SUPABASE_PUBLIC_URL && SUPABASE_PUBLIC_KEY);
}

export function getSupabasePublicEnv() {
  return {
    url: requiredEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_PUBLIC_URL),
    publishableKey: requiredEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      SUPABASE_PUBLIC_KEY,
    ),
  };
}

export function getSiteUrl() {
  return SITE_URL;
}
