import "server-only";

import { hasSupabasePublicEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDisplayTeamPosition } from "@/lib/team-positions";

type CommentAuthorRecord = {
  display_name: string;
  username: string | null;
  position_title: string | null;
};

type CommentRecord = {
  id: number;
  post_id: number;
  author_id: string;
  parent_id: number | null;
  content: string;
  status: "visible" | "hidden" | "deleted";
  created_at: string;
  updated_at: string;
  author: CommentAuthorRecord | null;
};

type LikeRecord = {
  id: number;
  user_id: string;
};

export type CommentViewModel = {
  id: number;
  postId: number;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  authorRole: string;
  authorSlug: string | null;
};

export type PostInteractionViewModel = {
  comments: CommentViewModel[];
  commentsCount: number;
  likesCount: number;
  viewerHasLiked: boolean;
};

export type PostInteractionCounts = {
  likesCount: number;
  commentsCount: number;
};

export async function getPostInteractionCounts(
  postIds: number[],
): Promise<{ counts: Map<number, PostInteractionCounts>; failed: boolean }> {
  const counts = new Map<number, PostInteractionCounts>();

  if (!postIds.length) {
    return { counts, failed: false };
  }

  if (!hasSupabasePublicEnv()) {
    postIds.forEach((id) => {
      counts.set(id, { likesCount: id + 4, commentsCount: 2 });
    });
    return { counts, failed: false };
  }

  const supabase = await createSupabaseServerClient();
  postIds.forEach((id) => {
    counts.set(id, { likesCount: 0, commentsCount: 0 });
  });

  const { data, error } = await supabase.rpc("post_interaction_counts", {
    post_ids: postIds,
  });

  if (error) {
    console.error("[posts] 互动统计加载失败", error);
    return { counts, failed: true };
  }

  (
    (data ?? []) as {
      post_id: number;
      likes_count: number;
      comments_count: number;
    }[]
  ).forEach((row) => {
    counts.set(row.post_id, {
      likesCount: Number(row.likes_count),
      commentsCount: Number(row.comments_count),
    });
  });

  return { counts, failed: false };
}

function toCommentViewModel(comment: CommentRecord): CommentViewModel {
  return {
    id: comment.id,
    postId: comment.post_id,
    authorId: comment.author_id,
    content: comment.content,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
    authorName: comment.author?.display_name ?? "DQ Member",
    authorRole: getDisplayTeamPosition(comment.author?.position_title, 3),
    authorSlug: comment.author?.username ?? null,
  };
}

function getFallbackComments(postId: number): CommentViewModel[] {
  return [
    {
      id: postId * 10 + 1,
      postId,
      authorId: `demo-commenter-${postId}-1`,
      content:
        "这篇复盘很有帮助，尤其是把团队沟通断点写得很具体，后面执行起来会更清晰。",
      createdAt: "2026-05-03T12:30:00.000Z",
      updatedAt: "2026-05-03T12:30:00.000Z",
      authorName: "夜巡",
      authorRole: "战术记录",
      authorSlug: null,
    },
    {
      id: postId * 10 + 2,
      postId,
      authorId: `demo-commenter-${postId}-2`,
      content:
        "建议后续把训练前后的分工变化也一起记录下来，这样新成员回看时会更容易进入状态。",
      createdAt: "2026-05-03T13:05:00.000Z",
      updatedAt: "2026-05-03T13:05:00.000Z",
      authorName: "折光",
      authorRole: "正式成员",
      authorSlug: null,
    },
  ];
}

export async function getPostInteractions(
  postId: number,
  viewerId?: string | null,
): Promise<PostInteractionViewModel> {
  if (!hasSupabasePublicEnv()) {
    const comments = getFallbackComments(postId);

    return {
      comments,
      commentsCount: comments.length,
      likesCount: postId + 4,
      viewerHasLiked: false,
    };
  }

  const supabase = await createSupabaseServerClient();
  const [commentsResult, likesResult] = await Promise.all([
    supabase
      .from("comments")
      .select(
        "id, post_id, author_id, parent_id, content, status, created_at, updated_at, author:profiles!comments_author_id_fkey(display_name, username, position_title)",
      )
      .eq("post_id", postId)
      .is("parent_id", null)
      .eq("status", "visible")
      .order("created_at", { ascending: true }),
    supabase.from("likes").select("id, user_id").eq("post_id", postId),
  ]);

  if (commentsResult.error) {
    console.error("[posts] 评论列表加载失败", {
      postId,
      error: commentsResult.error,
    });
  }
  if (likesResult.error) {
    console.error("[posts] 点赞列表加载失败", {
      postId,
      error: likesResult.error,
    });
  }

  const comments = (commentsResult.data ?? []).map((comment: unknown) =>
    toCommentViewModel(comment as CommentRecord),
  );
  const likes = (likesResult.data ?? []) as LikeRecord[];

  return {
    comments,
    commentsCount: comments.length,
    likesCount: likes.length,
    viewerHasLiked: viewerId
      ? likes.some((like) => like.user_id === viewerId)
      : false,
  };
}
