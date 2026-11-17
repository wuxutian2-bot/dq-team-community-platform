import "server-only";
import { getSupabasePublicEnv } from "@/lib/env";

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requiredEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseAdminEnv() {
  return {
    ...getSupabasePublicEnv(),
    serviceRoleKey: requiredEnv(
      "SUPABASE_SERVICE_ROLE_KEY",
      SUPABASE_SERVICE_ROLE_KEY,
    ),
  };
}
