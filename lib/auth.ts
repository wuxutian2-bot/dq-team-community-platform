import "server-only";

import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { hasSupabasePublicEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProfileStatus = "pending" | "active" | "disabled";

export type AuthProfile = {
  id: string;
  username: string | null;
  display_name: string;
  bio: string;
  avatar_path: string | null;
  favorite_game: string | null;
  position_title: string | null;
  role_level: number;
  status: ProfileStatus;
  is_profile_public: boolean;
};

export type AuthContext = {
  isConfigured: boolean;
  user: User | null;
  profile: AuthProfile | null;
};

export function sanitizeNextPath(value: string | null | undefined) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/login") ||
    value.startsWith("/auth")
  ) {
    return "/profile";
  }

  return value;
}

export function buildRedirectPath(
  pathname: string,
  params: Record<string, string | null | undefined>,
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function getRoleLabel(roleLevel: number | null | undefined) {
  switch (roleLevel) {
    case 1:
      return "队长 / 超级管理员";
    case 2:
      return "副队 / 副管理员";
    case 3:
      return "正式成员";
    default:
      return "游客 / 待激活";
  }
}

export const getAuthContext = cache(async (): Promise<AuthContext> => {
  if (!hasSupabasePublicEnv()) {
    return {
      isConfigured: false,
      user: null,
      profile: null,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isConfigured: true,
      user: null,
      profile: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, avatar_path, favorite_game, position_title, role_level, status, is_profile_public",
    )
    .eq("id", user.id)
    .maybeSingle<AuthProfile>();

  return {
    isConfigured: true,
    user,
    profile: profile ?? null,
  };
});
