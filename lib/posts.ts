import "server-only";

import { hasSupabasePublicEnv } from "@/lib/env";
import { getPostInteractionCounts } from "@/lib/post-interactions";
import {
  getStorageSignedUrl,
  getStorageSignedUrls,
  STORAGE_BUCKETS,
} from "@/lib/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { featuredPosts } from "@/lib/site-data";
import { getDisplayTeamPosition } from "@/lib/team-positions";

type PostAuthorRecord = {
  display_name: string;
  username: string | null;
  position_title: string | null;
  avatar_path: string | null;
};

type PostRecord = {
  id: number;
  author_id: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image_path: string | null;
  visibility: "public" | "members";
  status: "draft" | "published" | "hidden" | "archived";
  comments_enabled: boolean;
  created_at: string;
  updated_at: string;
  author: PostAuthorRecord | null;
};

export type PostViewModel = {
  id: number;
  authorId: string;
  title: string;
  excerpt: string;
  content: string;
  visibility: "public" | "members";
  visibilityLabel: string;
  status: "draft" | "published" | "hidden" | "archived";
  statusLabel: string;
  commentsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  authorRole: string;
  authorSlug: string | null;
  authorAvatarUrl: string | null;
  readingMinutes: number;
  coverImageUrl: string | null;
};

const POST_FULL_SELECT =
  "id, author_id, title, excerpt, content, cover_image_path, visibility, status, comments_enabled, created_at, updated_at, author:profiles!posts_author_id_fkey(display_name, username, position_title, avatar_path)";

export const POSTS_PAGE_SIZE = 10;

export type PostsFeedScope = "all" | "public" | "members";
export type PostsFeedSort = "latest" | "likes" | "comments";

export type PostsFeedOptions = {
  page?: number;
  query?: string;
  scope?: PostsFeedScope;
  sort?: PostsFeedSort;
};

export type PostFeedEntry = PostViewModel & {
  likesCount: number;
  commentsCount: number;
};

export type PostsFeedResult = {
  status: "ok" | "error";
  posts: PostFeedEntry[];
  total: number;
  page: number;
  pageCount: number;
  scopeCounts: Record<PostsFeedScope, number>;
  stats: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    authorCount: number;
  };
  hotPosts: {
    id: number;
    title: string;
    likesCount: number;
    commentsCount: number;
  }[];
  countsFailed: boolean;
};

type PostIndexRecord = {
  id: number;
  author_id: string;
  title: string;
  excerpt: string;
  visibility: "public" | "members";
  created_at: string;
  author: { display_name: string } | null;
};

function emptyFeedResult(status: "ok" | "error"): PostsFeedResult {
  return {
    status,
    posts: [],
    total: 0,
    page: 1,
    pageCount: 1,
    scopeCounts: { all: 0, public: 0, members: 0 },
    stats: { totalPosts: 0, totalLikes: 0, totalComments: 0, authorCount: 0 },
    hotPosts: [],
    countsFailed: false,
  };
}

function getVisibilityLabel(visibility: PostViewModel["visibility"]) {
  return visibility === "members" ? "成员可见" : "公开可见";
}

function getStatusLabel(status: PostViewModel["status"]) {
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

function estimateReadingMinutes(content: string) {
  const text = content.replace(/\s+/g, "");
  return Math.max(1, Math.ceil(text.length / 240));
}

function toPostViewModel(
  post: PostRecord,
  coverImageUrl: string | null,
  authorAvatarUrl: string | null,
): PostViewModel {
  return {
    id: post.id,
    authorId: post.author_id,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    visibility: post.visibility,
    visibilityLabel: getVisibilityLabel(post.visibility),
    status: post.status,
    statusLabel: getStatusLabel(post.status),
    commentsEnabled: post.comments_enabled,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    authorName: post.author?.display_name ?? "DQ Member",
    authorRole: getDisplayTeamPosition(post.author?.position_title, 3),
    authorSlug: post.author?.username ?? null,
    authorAvatarUrl,
    readingMinutes: estimateReadingMinutes(post.content),
    coverImageUrl,
  };
}

function mapFallbackPosts(): PostViewModel[] {
  return featuredPosts.map((post, index) => ({
    id: index + 1,
    authorId: `demo-author-${index + 1}`,
    title: post.title,
    excerpt: post.excerpt,
    content: `${post.excerpt}\n\n这是当前阶段的演示帖子内容，用来承接真实帖子详情页结构。等 Supabase 配置完成并有真实数据后，这里会自动切换为数据库内容。`,
    visibility: "public",
    visibilityLabel: "公开可见",
    status: "published",
    statusLabel: "已发布",
    commentsEnabled: true,
    createdAt: `2026-05-0${index + 1}T12:00:00.000Z`,
    updatedAt: `2026-05-0${index + 1}T12:00:00.000Z`,
    authorName: post.author,
    authorRole: post.category,
    authorSlug: null,
    authorAvatarUrl: null,
    readingMinutes: 2,
    coverImageUrl: null,
  }));
}

export async function getPostsFeed(
  options: PostsFeedOptions = {},
): Promise<PostsFeedResult> {
  const scope: PostsFeedScope = options.scope ?? "all";
  const sort: PostsFeedSort = options.sort ?? "latest";
  const search = (options.query ?? "").trim().toLocaleLowerCase();
  const requestedPage =
    Number.isInteger(options.page) && (options.page ?? 0) > 0
      ? (options.page as number)
      : 1;
  const isConfigured = hasSupabasePublicEnv();
  const supabase = isConfigured ? await createSupabaseServerClient() : null;

  let index: PostIndexRecord[];

  if (!supabase) {
    index = mapFallbackPosts().map((post) => ({
      id: post.id,
      author_id: post.authorId,
      title: post.title,
      excerpt: post.excerpt,
      visibility: post.visibility,
      created_at: post.createdAt,
      author: { display_name: post.authorName },
    }));
  } else {
    // 先只取筛选与排序需要的摘要字段，正文和封面留到分页后按页取
    const { data, error } = await supabase
      .from("posts")
      .select(
        "id, author_id, title, excerpt, visibility, created_at, author:profiles!posts_author_id_fkey(display_name)",
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[posts] 帖子列表加载失败", error);
      return emptyFeedResult("error");
    }

    index = (data ?? []) as unknown as PostIndexRecord[];
  }

  const { counts, failed: countsFailed } = await getPostInteractionCounts(
    index.map((post) => post.id),
  );
  const likesOf = (id: number) => counts.get(id)?.likesCount ?? 0;
  const commentsOf = (id: number) => counts.get(id)?.commentsCount ?? 0;
  const byNewest = (a: PostIndexRecord, b: PostIndexRecord) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

  const scopeCounts: Record<PostsFeedScope, number> = {
    all: index.length,
    public: index.filter((post) => post.visibility === "public").length,
    members: index.filter((post) => post.visibility === "members").length,
  };

  const stats = {
    totalPosts: index.length,
    totalLikes: index.reduce((sum, post) => sum + likesOf(post.id), 0),
    totalComments: index.reduce((sum, post) => sum + commentsOf(post.id), 0),
    authorCount: new Set(index.map((post) => post.author_id)).size,
  };

  const hotPosts = [...index]
    .sort(
      (a, b) =>
        likesOf(b.id) +
        commentsOf(b.id) -
        (likesOf(a.id) + commentsOf(a.id)) ||
        byNewest(a, b),
    )
    .slice(0, 3)
    .map((post) => ({
      id: post.id,
      title: post.title,
      likesCount: likesOf(post.id),
      commentsCount: commentsOf(post.id),
    }));

  const matches = index
    .filter(
      (post) =>
        (scope === "all" || post.visibility === scope) &&
        `${post.title} ${post.excerpt} ${post.author?.display_name ?? ""}`
          .toLocaleLowerCase()
          .includes(search),
    )
    .sort((a, b) => {
      if (sort === "likes") {
        return likesOf(b.id) - likesOf(a.id) || byNewest(a, b);
      }
      if (sort === "comments") {
        return commentsOf(b.id) - commentsOf(a.id) || byNewest(a, b);
      }
      return byNewest(a, b);
    });

  const total = matches.length;
  const pageCount = Math.max(1, Math.ceil(total / POSTS_PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const pageIds = matches
    .slice((page - 1) * POSTS_PAGE_SIZE, page * POSTS_PAGE_SIZE)
    .map((post) => post.id);

  let viewModels: PostViewModel[] = [];

  if (pageIds.length) {
    if (!supabase) {
      const fallback = mapFallbackPosts();
      viewModels = pageIds
        .map((id) => fallback.find((post) => post.id === id))
        .filter((post): post is PostViewModel => Boolean(post));
    } else {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_FULL_SELECT)
        .in("id", pageIds);

      if (error) {
        console.error("[posts] 帖子分页内容加载失败", { pageIds, error });
        return emptyFeedResult("error");
      }

      const records = (data ?? []) as unknown as PostRecord[];
      const [coverUrls, avatarUrls] = await Promise.all([
        getStorageSignedUrls(
          STORAGE_BUCKETS.postCovers,
          records.map((post) => post.cover_image_path),
        ),
        getStorageSignedUrls(
          STORAGE_BUCKETS.avatars,
          records.map((post) => post.author?.avatar_path),
        ),
      ]);
      const byId = new Map(
        records.map((post) => [
          post.id,
          toPostViewModel(
            post,
            post.cover_image_path
              ? coverUrls.get(post.cover_image_path) ?? null
              : null,
            post.author?.avatar_path
              ? avatarUrls.get(post.author.avatar_path) ?? null
              : null,
          ),
        ]),
      );
      viewModels = pageIds
        .map((id) => byId.get(id))
        .filter((post): post is PostViewModel => Boolean(post));
    }
  }

  return {
    status: "ok",
    posts: viewModels.map((post) => ({
      ...post,
      likesCount: likesOf(post.id),
      commentsCount: commentsOf(post.id),
    })),
    total,
    page,
    pageCount,
    scopeCounts,
    stats,
    hotPosts,
    countsFailed,
  };
}

export async function getPostsByAuthor(authorId: string) {
  if (!hasSupabasePublicEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_FULL_SELECT)
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[posts] 成员帖子列表加载失败", { authorId, error });
    return [];
  }

  const posts = (data ?? []) as unknown as PostRecord[];
  const [coverUrls, avatarUrls] = await Promise.all([
    getStorageSignedUrls(
      STORAGE_BUCKETS.postCovers,
      posts.map((post) => post.cover_image_path),
    ),
    getStorageSignedUrls(
      STORAGE_BUCKETS.avatars,
      posts.map((post) => post.author?.avatar_path),
    ),
  ]);

  return posts.map((post) =>
    toPostViewModel(
      post,
      post.cover_image_path ? coverUrls.get(post.cover_image_path) ?? null : null,
      post.author?.avatar_path
        ? avatarUrls.get(post.author.avatar_path) ?? null
        : null,
    ),
  );
}

export async function getPostById(id: number) {
  if (!hasSupabasePublicEnv()) {
    return mapFallbackPosts().find((post) => post.id === id) ?? null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_FULL_SELECT)
    .eq("id", id)
    .maybeSingle<PostRecord>();

  if (error) {
    console.error("[posts] 帖子详情加载失败", { id, error });
    throw new Error("帖子加载失败，请稍后重试。");
  }

  if (!data) {
    return null;
  }

  const [coverImageUrl, authorAvatarUrl] = await Promise.all([
    getStorageSignedUrl(STORAGE_BUCKETS.postCovers, data.cover_image_path),
    getStorageSignedUrl(STORAGE_BUCKETS.avatars, data.author?.avatar_path),
  ]);

  return toPostViewModel(data, coverImageUrl, authorAvatarUrl);
}

export function formatPostDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Shanghai",
  }).format(parsed);
}
