import "server-only";

import { hasSupabasePublicEnv } from "@/lib/env";
import { getStorageSignedUrl, getStorageSignedUrls, STORAGE_BUCKETS } from "@/lib/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { memberSpotlights } from "@/lib/site-data";
import { getDisplayTeamPosition } from "@/lib/team-positions";

export type MemberRecord = {
  id: string;
  username: string | null;
  display_name: string;
  bio: string;
  avatar_path: string | null;
  banner_path: string | null;
  favorite_game: string | null;
  position_title: string | null;
  joined_at: string;
  role_level: number;
  status: "pending" | "active" | "disabled";
  is_profile_public: boolean;
};

export type MemberViewModel = {
  id: string;
  slug: string;
  displayName: string;
  roleTitle: string;
  roleLevel: number;
  roleLabel: string;
  bio: string;
  tagline: string;
  favoriteGame: string | null;
  joinedAt: string;
  visibilityLabel: string;
  initials: string;
  avatarUrl: string | null;
};

const roleLabels: Record<number, string> = {
  1: "队长 / 超级管理员",
  2: "副队 / 副管理员",
  3: "正式成员",
  4: "游客 / 待激活",
};

function getRoleLabel(roleLevel: number) {
  return roleLabels[roleLevel] ?? roleLabels[4];
}

function getInitials(name: string) {
  const compact = name.replace(/\s+/g, "");
  return compact.slice(0, 2).toUpperCase();
}

function toMemberViewModel(
  member: MemberRecord,
  avatarUrl: string | null,
): MemberViewModel {
  const roleTitle = getDisplayTeamPosition(
    member.position_title,
    member.role_level,
  );
  const tagline =
    member.bio?.trim() ||
    `${member.display_name} 目前还没有填写个人简介，后续可以在个人中心补充资料。`;

  return {
    id: member.id,
    slug: member.username || member.id,
    displayName: member.display_name,
    roleTitle,
    roleLevel: member.role_level,
    roleLabel: getRoleLabel(member.role_level),
    bio: member.bio,
    tagline,
    favoriteGame: member.favorite_game,
    joinedAt: member.joined_at,
    visibilityLabel: member.is_profile_public ? "公开资料" : "仅成员可见",
    initials: getInitials(member.display_name),
    avatarUrl,
  };
}

function mapFallbackMembers(): MemberViewModel[] {
  return memberSpotlights.map((member, index) => ({
    id: member.id,
    slug: member.id,
    displayName: member.name,
    roleTitle: member.role,
    roleLevel: Number(member.level.replace("Level ", "")),
    roleLabel: member.role,
    bio: member.tagline,
    tagline: member.tagline,
    favoriteGame: member.specialty,
    joinedAt: `202${index + 3}-01-01`,
    visibilityLabel: "演示数据",
    initials: getInitials(member.name),
    avatarUrl: null,
  }));
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export const MEMBERS_PAGE_SIZE = 12;

export type MemberDirectoryRole = "all" | "leaders" | "members";

export type MemberDirectoryOptions = {
  page?: number;
  query?: string;
  role?: MemberDirectoryRole;
};

export type MemberDirectoryResult = {
  status: "ok" | "error";
  members: MemberViewModel[];
  total: number;
  page: number;
  pageCount: number;
};

const MEMBER_SELECT =
  "id, username, display_name, bio, avatar_path, banner_path, favorite_game, position_title, joined_at, role_level, status, is_profile_public";

function sanitizeSearchTerm(value: string) {
  // 去掉会破坏 PostgREST or 语法的字符
  return value.replace(/[^\p{L}\p{N}\s_-]/gu, "").trim();
}

export async function getPublicMembers(
  options: MemberDirectoryOptions = {},
): Promise<MemberDirectoryResult> {
  const role: MemberDirectoryRole = options.role ?? "all";
  const search = sanitizeSearchTerm(options.query ?? "");
  const requestedPage =
    Number.isInteger(options.page) && (options.page ?? 0) > 0
      ? (options.page as number)
      : 1;

  if (!hasSupabasePublicEnv()) {
    const term = search.toLocaleLowerCase();
    const matches = mapFallbackMembers().filter(
      (member) =>
        (role === "all" ||
          (role === "leaders"
            ? member.roleLevel <= 2
            : member.roleLevel === 3)) &&
        `${member.displayName} ${member.roleTitle} ${member.favoriteGame ?? ""}`
          .toLocaleLowerCase()
          .includes(term),
    );
    const pageCount = Math.max(
      1,
      Math.ceil(matches.length / MEMBERS_PAGE_SIZE),
    );
    const page = Math.min(requestedPage, pageCount);
    return {
      status: "ok",
      members: matches.slice(
        (page - 1) * MEMBERS_PAGE_SIZE,
        page * MEMBERS_PAGE_SIZE,
      ),
      total: matches.length,
      page,
      pageCount,
    };
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("profiles")
    .select(MEMBER_SELECT, { count: "exact" })
    .eq("status", "active")
    .eq("is_profile_public", true);

  if (role === "leaders") {
    query = query.lte("role_level", 2);
  } else if (role === "members") {
    query = query.eq("role_level", 3);
  }

  if (search) {
    const pattern = `%${search}%`;
    query = query.or(
      `display_name.ilike.${pattern},position_title.ilike.${pattern},favorite_game.ilike.${pattern}`,
    );
  }

  const from = (requestedPage - 1) * MEMBERS_PAGE_SIZE;
  const { data, error, count } = await query
    .order("role_level", { ascending: true })
    .order("joined_at", { ascending: true })
    .range(from, from + MEMBERS_PAGE_SIZE - 1);

  if (error) {
    console.error("[members] 成员目录加载失败", error);
    return {
      status: "error",
      members: [],
      total: 0,
      page: 1,
      pageCount: 1,
    };
  }

  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / MEMBERS_PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const members = (data ?? []) as MemberRecord[];
  const avatarUrls = await getStorageSignedUrls(
    STORAGE_BUCKETS.avatars,
    members.map((member) => member.avatar_path),
  );

  return {
    status: "ok",
    members: members.map((member) =>
      toMemberViewModel(
        member,
        member.avatar_path ? avatarUrls.get(member.avatar_path) ?? null : null,
      ),
    ),
    total,
    page,
    pageCount,
  };
}

export async function getPublicMemberByIdentifier(identifier: string) {
  if (!hasSupabasePublicEnv()) {
    const fallback = mapFallbackMembers();
    return fallback.find((item) => item.slug === identifier) ?? null;
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("profiles")
    .select(MEMBER_SELECT)
    .eq("status", "active")
    .eq("is_profile_public", true);

  query = isUuid(identifier)
    ? query.eq("id", identifier)
    : query.eq("username", identifier);

  const { data, error } = await query.maybeSingle<MemberRecord>();

  if (error) {
    console.error("[members] 成员详情加载失败", { identifier, error });
    throw new Error("成员资料加载失败，请稍后重试。");
  }

  if (!data) {
    return null;
  }

  const avatarUrl = await getStorageSignedUrl(
    STORAGE_BUCKETS.avatars,
    data.avatar_path,
  );

  return toMemberViewModel(data, avatarUrl);
}

export function formatJoinDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Shanghai",
  }).format(parsed);
}
