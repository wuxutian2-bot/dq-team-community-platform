import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv, hasSupabasePublicEnv } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabasePublicEnv();
  type CookieSetInput = {
    name: string;
    value: string;
    options?: Record<string, unknown>;
  };

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieSetInput[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options as never);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}
