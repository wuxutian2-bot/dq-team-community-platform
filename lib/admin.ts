import "server-only";

import { getAchievementsFeed, type AchievementViewModel } from "@/lib/achievements";
import { getRoleLabel } from "@/lib/auth";
import { hasSupabasePublicEnv } from "@/lib/env";
import { formatEventDate, getTeamEventsFeed, type TeamEventViewModel } from "@/lib/history";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDisplayTeamPosition } from "@/lib/team-positions";

type AdminUserRecord = {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string;
  position_title: string | null;
  role_level: number;
  status: "pending" | "active" | "disabled";
  is_profile_public: boolean;
  joined_at: string;
};

type AdminPostAuthorRecord = {
  display_name: string;
  username: string | null;
};

type AdminPostRecord = {
  id: number;
  title: string;
  visibility: "public" | "members";
  status: "draft" | "published" | "hidden" | "archived";
  comments_enabled: boolean;
  created_at: string;
  updated_at: string;
  author: AdminPostAuthorRecord | null;
};

type AdminCommentAuthorRecord = {
  display_name: string;
  username: string | null;
};

type AdminCommentPostRecord = {
  id: number;
  title: string;
};

type AdminCommentRecord = {
  id: number;
  post_id: number;
  author_id: string;
  content: string;
  status: "visible" | "hidden" | "deleted";
  created_at: string;
  updated_at: string;
  author: AdminCommentAuthorRecord | null;
  post: AdminCommentPostRecord | null;
};

type AnnouncementRecord = {
  id: number;
  title: string;
  content: string;
  audience: "public" | "members" | "admins";
  is_pinned: boolean;
  is_published: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminDashboardData = {
  pendingUsers: number;
  publishedPosts: number;
  hiddenComments: number;
  activeAnnouncements: number;
};

export type AdminUserViewModel = {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string;
  positionTitle: string;
  roleLevel: number;
  roleLabel: string;
  status: "pending" | "active" | "disabled";
  publicLabel: string;
  joinedAt: string;
};

export type AdminPostViewModel = {
  id: number;
  title: string;
  authorName: string;
  visibility: "public" | "members";
  visibilityLabel: string;
  status: "draft" | "published" | "hidden" | "archived";
  statusLabel: string;
  commentsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminCommentViewModel = {
  id: number;
  postId: number;
  authorId: string;
  content: string;
  status: "visible" | "hidden" | "deleted";
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  postTitle: string;
};

export type AdminAnnouncementViewModel = {
  id: number;
  title: string;
  content: string;
  audience: "public" | "members" | "admins";
  audienceLabel: string;
  isPinned: boolean;
  isPublished: boolean;
  statusLabel: string;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

export type AdminListPage<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function normalizePageParam(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 10000) : 1;
}

function getPostStatusLabel(status: AdminPostViewModel["status"]) {
  switch (status) {
    case "draft":
      return "草稿";
    case "published":
      return "已发布";
    case "hidden":
      return "已隐藏";
    case "archived":
      return "已归档";
    default:
      return "未知状态";
  }
}

function getVisibilityLabel(visibility: AdminPostViewModel["visibility"]) {
  return visibility === "members" ? "成员可见" : "公开可见";
}

function getCommentStatusLabel(status: AdminCommentViewModel["status"]) {
  switch (status) {
    case "visible":
      return "可见";
    case "hidden":
      return "已隐藏";
    case "deleted":
      return "已删除";
    default:
      return "未知状态";
  }
}

function getAnnouncementAudienceLabel(
  audience: AdminAnnouncementViewModel["audience"],
) {
  switch (audience) {
    case "public":
      return "公开";
    case "members":
      return "成员";
    case "admins":
      return "管理员";
    default:
      return "未知";
  }
}

function getAnnouncementStatusLabel(record: AnnouncementRecord) {
  if (!record.is_published) {
    return "未发布";
  }

  if (record.is_pinned) {
    return "置顶中";
  }

  return "已发布";
}

function toUserViewModel(user: AdminUserRecord): AdminUserViewModel {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.display_name,
    positionTitle: getDisplayTeamPosition(user.position_title, user.role_level),
    roleLevel: user.role_level,
    roleLabel: getRoleLabel(user.role_level),
    status: user.status,
    publicLabel: user.is_profile_public ? "公开资料" : "成员内可见",
    joinedAt: user.joined_at,
  };
}

function toPostViewModel(post: AdminPostRecord): AdminPostViewModel {
  return {
    id: post.id,
    title: post.title,
    authorName: post.author?.display_name ?? "未知成员",
    visibility: post.visibility,
    visibilityLabel: getVisibilityLabel(post.visibility),
    status: post.status,
    statusLabel: getPostStatusLabel(post.status),
    commentsEnabled: post.comments_enabled,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
  };
}

function toCommentViewModel(comment: AdminCommentRecord): AdminCommentViewModel {
  return {
    id: comment.id,
    postId: comment.post_id,
    authorId: comment.author_id,
    content: comment.content,
    status: comment.status,
    statusLabel: getCommentStatusLabel(comment.status),
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
    authorName: comment.author?.display_name ?? "未知成员",
    postTitle: comment.post?.title ?? "未知帖子",
  };
}

function toAnnouncementViewModel(
  announcement: AnnouncementRecord,
): AdminAnnouncementViewModel {
  return {
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    audience: announcement.audience,
    audienceLabel: getAnnouncementAudienceLabel(announcement.audience),
    isPinned: announcement.is_pinned,
    isPublished: announcement.is_published,
    statusLabel: getAnnouncementStatusLabel(announcement),
    startsAt: announcement.starts_at,
    endsAt: announcement.ends_at,
    createdAt: announcement.created_at,
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  if (!hasSupabasePublicEnv()) {
    return {
      pendingUsers: 0,
      publishedPosts: 0,
      hiddenComments: 0,
      activeAnnouncements: 0,
    };
  }

  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();
  const [pendingUsers, publishedPosts, hiddenComments, activeAnnouncements] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("status", "published"),
      supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("status", "hidden"),
      supabase
        .from("site_announcements")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`),
    ]);

  return {
    pendingUsers: pendingUsers.count ?? 0,
    publishedPosts: publishedPosts.count ?? 0,
    hiddenComments: hiddenComments.count ?? 0,
    activeAnnouncements: activeAnnouncements.count ?? 0,
  };
}

export async function getAdminUsers(
  pageParam?: string,
  pageSize = 20,
): Promise<AdminListPage<AdminUserViewModel>> {
  const supabase = await createSupabaseServerClient();
  const page = normalizePageParam(pageParam);
  const from = (page - 1) * pageSize;
  const { data, count } = await supabase
    .from("profiles")
    .select(
      "id, email, username, display_name, position_title, role_level, status, is_profile_public, joined_at",
      { count: "exact" },
    )
    .order("role_level", { ascending: true })
    .order("joined_at", { ascending: true })
    .range(from, from + pageSize - 1);

  const total = count ?? 0;
  return {
    items: (data ?? []).map((user: unknown) =>
      toUserViewModel(user as AdminUserRecord),
    ),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAdminUserById(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, email, username, display_name, position_title, role_level, status, is_profile_public, joined_at",
    )
    .eq("id", userId)
    .maybeSingle();

  return data ? toUserViewModel(data as AdminUserRecord) : null;
}

export async function getAdminPosts(
  pageParam?: string,
  pageSize = 15,
): Promise<AdminListPage<AdminPostViewModel>> {
  const supabase = await createSupabaseServerClient();
  const page = normalizePageParam(pageParam);
  const from = (page - 1) * pageSize;
  const { data, count } = await supabase
    .from("posts")
    .select(
      "id, title, visibility, status, comments_enabled, created_at, updated_at, author:profiles!posts_author_id_fkey(display_name, username)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  const total = count ?? 0;
  return {
    items: (data ?? []).map((post: unknown) =>
      toPostViewModel(post as AdminPostRecord),
    ),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAdminComments(
  pageParam?: string,
  pageSize = 20,
): Promise<AdminListPage<AdminCommentViewModel>> {
  const supabase = await createSupabaseServerClient();
  const page = normalizePageParam(pageParam);
  const from = (page - 1) * pageSize;
  const { data, count } = await supabase
    .from("comments")
    .select(
      "id, post_id, author_id, content, status, created_at, updated_at, author:profiles!comments_author_id_fkey(display_name, username), post:posts!comments_post_id_fkey(id, title)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  const total = count ?? 0;
  return {
    items: (data ?? []).map((comment: unknown) =>
      toCommentViewModel(comment as AdminCommentRecord),
    ),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getAdminHistoryItems(): Promise<TeamEventViewModel[]> {
  return getTeamEventsFeed();
}

export async function getAdminAchievementItems(): Promise<
  AchievementViewModel[]
> {
  return getAchievementsFeed();
}

export async function getAdminAnnouncements() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("site_announcements")
    .select(
      "id, title, content, audience, is_pinned, is_published, starts_at, ends_at, created_at, updated_at",
    )
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []).map((announcement: unknown) =>
    toAnnouncementViewModel(announcement as AnnouncementRecord),
  );
}

export function formatAdminDate(value: string | null | undefined) {
  if (!value) {
    return "未设置";
  }

  return formatEventDate(value);
}
