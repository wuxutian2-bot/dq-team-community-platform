"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildRedirectPath, getAuthContext } from "@/lib/auth";
import { STORAGE_BUCKETS, removeStorageFiles, uploadImageToStorage } from "@/lib/storage";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getPostDetailPath(postId: number) {
  return `/posts/${postId}`;
}

function getPostIdFromFormData(formData: FormData) {
  const postId = Number(getString(formData, "post_id"));
  return Number.isInteger(postId) && postId > 0 ? postId : null;
}

async function requireActiveMember(postId: number) {
  const auth = await getAuthContext();
  const user = auth.user;
  const profile = auth.profile;

  if (!user) {
    redirect(
      buildRedirectPath("/login", {
        next: getPostDetailPath(postId),
        error: "请先登录后再参与互动。",
      }),
    );
  }

  if (
    !profile ||
    profile.status !== "active" ||
    profile.role_level > 3
  ) {
    redirect(
      buildRedirectPath(getPostDetailPath(postId), {
        error: "当前账号还没有互动权限，请联系管理员激活成员身份。",
      }),
    );
  }

  return { user, profile };
}

export async function createPost(formData: FormData) {
  const auth = await getAuthContext();

  if (!auth.user) {
    redirect(
      buildRedirectPath("/login", {
        next: "/posts/create",
        error: "请先登录后再发布帖子。",
      }),
    );
  }

  if (!auth.profile || auth.profile.status !== "active" || auth.profile.role_level > 3) {
    redirect(
      buildRedirectPath("/posts/create", {
        error: "当前账号还没有发布帖子权限，请联系管理员激活成员身份。",
      }),
    );
  }

  const title = getString(formData, "title");
  const excerpt = getString(formData, "excerpt");
  const content = getString(formData, "content");
  const visibility = getString(formData, "visibility");
  const status = getString(formData, "status");
  const commentsEnabled = formData.get("comments_enabled") === "on";
  const coverImage = formData.get("cover_image");

  if (!title || title.length > 120) {
    redirect(
      buildRedirectPath("/posts/create", {
        error: "帖子标题不能为空，且不能超过 120 个字符。",
      }),
    );
  }

  if (excerpt.length > 280) {
    redirect(
      buildRedirectPath("/posts/create", {
        error: "帖子摘要不能超过 280 个字符。",
      }),
    );
  }

  if (!content) {
    redirect(
      buildRedirectPath("/posts/create", {
        error: "请输入帖子正文后再发布。",
      }),
    );
  }

  if (!["public", "members"].includes(visibility)) {
    redirect(
      buildRedirectPath("/posts/create", {
        error: "帖子可见范围无效，请重新选择。",
      }),
    );
  }

  if (!["draft", "published"].includes(status)) {
    redirect(
      buildRedirectPath("/posts/create", {
        error: "帖子状态无效，请重新选择。",
      }),
    );
  }

  const supabase = await createSupabaseServerClient();
  let coverImagePath: string | null = null;

  if (coverImage instanceof File && coverImage.size > 0) {
    try {
      coverImagePath = await uploadImageToStorage({
        bucket: STORAGE_BUCKETS.postCovers,
        file: coverImage,
        folder: `posts/${auth.user.id}`,
      });
    } catch (error) {
      console.error("[posts] 帖子封面上传失败", error);
      redirect(
        buildRedirectPath("/posts/create", {
          error:
            error instanceof Error
              ? error.message
              : "帖子封面上传失败，请稍后重试。",
        }),
      );
    }
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: auth.user.id,
      title,
      excerpt,
      content,
      cover_image_path: coverImagePath,
      visibility,
      status,
      comments_enabled: commentsEnabled,
    })
    .select("id")
    .single<{ id: number }>();

  if (error || !data) {
    console.error("[posts] 帖子保存失败", error);
    await removeStorageFiles(STORAGE_BUCKETS.postCovers, [coverImagePath]);
    redirect(
      buildRedirectPath("/posts/create", {
        error: "帖子保存失败，请稍后重试。",
      }),
    );
  }

  revalidatePath("/posts");
  revalidatePath("/profile");
  redirect(
    buildRedirectPath(`/posts/${data.id}`, {
      message: status === "draft" ? "草稿已保存。" : "帖子已发布。",
    }),
  );
}

export async function editPost(formData: FormData) {
  const postId = getPostIdFromFormData(formData);

  if (!postId) {
    redirect(
      buildRedirectPath("/posts", {
        error: "帖子编辑请求无效，请返回帖子列表重试。",
      }),
    );
  }

  const auth = await requireActiveMember(postId);
  const editPath = `/posts/${postId}/edit`;
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("posts")
    .select("id, author_id, cover_image_path")
    .eq("id", postId)
    .maybeSingle<{
      id: number;
      author_id: string;
      cover_image_path: string | null;
    }>();

  if (!existing) {
    redirect(
      buildRedirectPath("/posts", {
        error: "帖子不存在或已被删除。",
      }),
    );
  }

  if (existing.author_id !== auth.user.id && auth.profile.role_level > 2) {
    redirect(
      buildRedirectPath(getPostDetailPath(postId), {
        error: "只有作者本人或管理员可以编辑这篇帖子。",
      }),
    );
  }

  const title = getString(formData, "title");
  const excerpt = getString(formData, "excerpt");
  const content = getString(formData, "content");
  const visibility = getString(formData, "visibility");
  const status = getString(formData, "status");
  const commentsEnabled = formData.get("comments_enabled") === "on";
  const coverImage = formData.get("cover_image");

  if (!title || title.length > 120) {
    redirect(
      buildRedirectPath(editPath, {
        error: "帖子标题不能为空，且不能超过 120 个字符。",
      }),
    );
  }

  if (excerpt.length > 280) {
    redirect(
      buildRedirectPath(editPath, {
        error: "帖子摘要不能超过 280 个字符。",
      }),
    );
  }

  if (!content) {
    redirect(
      buildRedirectPath(editPath, {
        error: "请输入帖子正文后再保存。",
      }),
    );
  }

  if (!["public", "members"].includes(visibility)) {
    redirect(
      buildRedirectPath(editPath, {
        error: "帖子可见范围无效，请重新选择。",
      }),
    );
  }

  if (!["draft", "published"].includes(status)) {
    redirect(
      buildRedirectPath(editPath, {
        error: "帖子状态无效，请重新选择。",
      }),
    );
  }

  let coverImagePath = existing.cover_image_path;
  let uploadedCoverPath: string | null = null;

  if (coverImage instanceof File && coverImage.size > 0) {
    try {
      coverImagePath = await uploadImageToStorage({
        bucket: STORAGE_BUCKETS.postCovers,
        file: coverImage,
        folder: `posts/${existing.author_id}`,
      });
      uploadedCoverPath = coverImagePath;
    } catch (error) {
      console.error("[posts] 帖子封面上传失败", error);
      redirect(
        buildRedirectPath(editPath, {
          error:
            error instanceof Error
              ? error.message
              : "帖子封面上传失败，请稍后重试。",
        }),
      );
    }
  }

  const { error } = await supabase
    .from("posts")
    .update({
      title,
      excerpt,
      content,
      cover_image_path: coverImagePath,
      visibility,
      status,
      comments_enabled: commentsEnabled,
    })
    .eq("id", postId);

  if (error) {
    console.error("[posts] 帖子更新失败", { postId, error });
    await removeStorageFiles(STORAGE_BUCKETS.postCovers, [uploadedCoverPath]);
    redirect(
      buildRedirectPath(editPath, {
        error: "帖子保存失败，请稍后重试。",
      }),
    );
  }

  if (uploadedCoverPath) {
    await removeStorageFiles(STORAGE_BUCKETS.postCovers, [
      existing.cover_image_path,
    ]);
  }

  revalidatePath("/posts");
  revalidatePath("/profile");
  revalidatePath(getPostDetailPath(postId));
  redirect(
    buildRedirectPath(getPostDetailPath(postId), {
      message: "帖子已更新。",
    }),
  );
}

export async function deletePost(formData: FormData) {
  const postId = getPostIdFromFormData(formData);

  if (!postId) {
    redirect(
      buildRedirectPath("/posts", {
        error: "帖子删除请求无效，请返回帖子列表重试。",
      }),
    );
  }

  const auth = await requireActiveMember(postId);
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("posts")
    .select("id, author_id, cover_image_path")
    .eq("id", postId)
    .maybeSingle<{
      id: number;
      author_id: string;
      cover_image_path: string | null;
    }>();

  if (!existing) {
    redirect(
      buildRedirectPath("/posts", {
        error: "帖子不存在或已被删除。",
      }),
    );
  }

  if (existing.author_id !== auth.user.id && auth.profile.role_level > 2) {
    redirect(
      buildRedirectPath(getPostDetailPath(postId), {
        error: "只有作者本人或管理员可以删除这篇帖子。",
      }),
    );
  }

  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) {
    redirect(
      buildRedirectPath(getPostDetailPath(postId), {
        error: "帖子删除失败，请稍后重试。",
      }),
    );
  }

  if (existing.cover_image_path) {
    const admin = createSupabaseAdminClient();
    await admin.storage
      .from(STORAGE_BUCKETS.postCovers)
      .remove([existing.cover_image_path]);
  }

  revalidatePath("/posts");
  revalidatePath("/profile");
  redirect(
    buildRedirectPath("/posts", {
      message: "帖子已删除。",
    }),
  );
}

export async function createComment(formData: FormData) {
  const postId = getPostIdFromFormData(formData);

  if (!postId) {
    redirect(
      buildRedirectPath("/posts", {
        error: "评论目标无效，请返回帖子列表重试。",
      }),
    );
  }

  const auth = await requireActiveMember(postId);
  const content = getString(formData, "content");

  if (!content || content.length > 2000) {
    redirect(
      buildRedirectPath(getPostDetailPath(postId), {
        error: "评论内容不能为空，且不能超过 2000 个字符。",
      }),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: auth.user.id,
    content,
    status: "visible",
  });

  if (error) {
    redirect(
      buildRedirectPath(getPostDetailPath(postId), {
        error: "评论发布失败，请稍后重试。",
      }),
    );
  }

  revalidatePath("/posts");
  revalidatePath(getPostDetailPath(postId));
  redirect(
    buildRedirectPath(getPostDetailPath(postId), {
      message: "评论已发布。",
    }),
  );
}

export async function deleteComment(formData: FormData) {
  const postId = getPostIdFromFormData(formData);
  const commentId = Number(getString(formData, "comment_id"));

  if (!postId || !Number.isInteger(commentId) || commentId <= 0) {
    redirect(
      buildRedirectPath("/posts", {
        error: "评论删除请求无效，请返回帖子列表重试。",
      }),
    );
  }

  await requireActiveMember(postId);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("post_id", postId);

  if (error) {
    redirect(
      buildRedirectPath(getPostDetailPath(postId), {
        error: "评论删除失败，请稍后重试。",
      }),
    );
  }

  revalidatePath("/posts");
  revalidatePath(getPostDetailPath(postId));
  redirect(
    buildRedirectPath(getPostDetailPath(postId), {
      message: "评论已删除。",
    }),
  );
}

export async function toggleLike(formData: FormData) {
  const postId = getPostIdFromFormData(formData);

  if (!postId) {
    redirect(
      buildRedirectPath("/posts", {
        error: "点赞目标无效，请返回帖子列表重试。",
      }),
    );
  }

  const auth = await requireActiveMember(postId);
  const supabase = await createSupabaseServerClient();
  const { data: existingLike } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", auth.user.id)
    .maybeSingle<{ id: number }>();

  if (existingLike) {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("id", existingLike.id)
      .eq("user_id", auth.user.id);

    if (error) {
      redirect(
        buildRedirectPath(getPostDetailPath(postId), {
          error: "取消点赞失败，请稍后重试。",
        }),
      );
    }

    revalidatePath("/posts");
    revalidatePath(getPostDetailPath(postId));
    redirect(
      buildRedirectPath(getPostDetailPath(postId), {
        message: "已取消点赞。",
      }),
    );
  }

  const { error } = await supabase.from("likes").insert({
    post_id: postId,
    user_id: auth.user.id,
  });

  if (error) {
    redirect(
      buildRedirectPath(getPostDetailPath(postId), {
        error: "点赞失败，请稍后重试。",
      }),
    );
  }

  revalidatePath("/posts");
  revalidatePath(getPostDetailPath(postId));
  redirect(
    buildRedirectPath(getPostDetailPath(postId), {
      message: "已点赞。",
    }),
  );
}
