export const metadata = { title: "编辑帖子" };

import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { editPost } from "@/app/posts/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { ImageFileInput } from "@/components/image-file-input";
import { PageHero } from "@/components/page-hero";
import { Panel } from "@/components/panel";
import { buildRedirectPath, getAuthContext } from "@/lib/auth";
import { getPostById } from "@/lib/posts";

type EditPostPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditPostPage({
  params,
  searchParams,
}: EditPostPageProps) {
  const [{ id }, query, auth] = await Promise.all([
    params,
    searchParams,
    getAuthContext(),
  ]);
  const postId = Number(id);

  if (!Number.isInteger(postId) || postId <= 0) {
    notFound();
  }

  if (!auth.user) {
    redirect(
      buildRedirectPath("/login", {
        next: `/posts/${postId}/edit`,
        error: "请先登录后再编辑帖子。",
      }),
    );
  }

  const post = await getPostById(postId);

  if (!post) {
    notFound();
  }

  const isOwner = auth.user.id === post.authorId;
  const isAdmin =
    auth.profile?.status === "active" && (auth.profile?.role_level ?? 99) <= 2;

  if (!isOwner && !isAdmin) {
    redirect(
      buildRedirectPath(`/posts/${postId}`, {
        error: "只有作者本人或管理员可以编辑这篇帖子。",
      }),
    );
  }

  return (
    <div className="page-shell">
      <PageHero
        eyebrow="EDIT POST"
        title="编辑帖子"
        description="修改标题、正文、可见范围或封面。保存后会立即对可见范围内的读者生效。"
      />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_290px]">
        <Panel className="p-6 sm:p-8">
          {query.error ? (
            <div className="rounded-[22px] border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm leading-7 text-rose-100">
              {query.error}
            </div>
          ) : null}

          <form action={editPost} className="mt-5 grid gap-4">
            <input type="hidden" name="post_id" value={post.id} />

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                帖子标题
              </span>
              <input
                type="text"
                name="title"
                defaultValue={post.title}
                maxLength={120}
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base text-white outline-none ring-0 placeholder:text-muted focus:border-accent/45"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                摘要
              </span>
              <textarea
                name="excerpt"
                rows={3}
                maxLength={280}
                defaultValue={post.excerpt}
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base leading-7 text-white outline-none ring-0 placeholder:text-muted focus:border-accent/45"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                帖子封面
              </span>
              {post.coverImageUrl ? (
                <div className="overflow-hidden rounded-[22px] border border-white/[0.06]">
                  <Image
                    src={post.coverImageUrl}
                    alt={`${post.title} cover`}
                    width={1400}
                    height={720}
                    className="h-44 w-full object-cover"
                  />
                </div>
              ) : null}
              <ImageFileInput
                name="cover_image"
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.18em] file:text-[#081109]"
              />
              <span className="text-xs leading-6 text-muted">
                可选。不选择新图片时保留当前封面。支持 JPG、PNG、WEBP，大小不超过 5MB。
              </span>
            </label>

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                正文
              </span>
              <textarea
                name="content"
                rows={12}
                defaultValue={post.content}
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base leading-7 text-white outline-none ring-0 placeholder:text-muted focus:border-accent/45"
                required
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm uppercase tracking-[0.22em] text-muted">
                  可见范围
                </span>
                <select
                  name="visibility"
                  defaultValue={post.visibility}
                  className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base text-white outline-none ring-0 focus:border-accent/45"
                >
                  <option value="public">公开可见</option>
                  <option value="members">仅成员可见</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm uppercase tracking-[0.22em] text-muted">
                  保存方式
                </span>
                <select
                  name="status"
                  defaultValue={
                    post.status === "draft" ? "draft" : "published"
                  }
                  className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base text-white outline-none ring-0 focus:border-accent/45"
                >
                  <option value="published">直接发布</option>
                  <option value="draft">保存草稿</option>
                </select>
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-[22px] border border-border bg-black/20 px-5 py-4 text-sm text-white">
              <input
                type="checkbox"
                name="comments_enabled"
                defaultChecked={post.commentsEnabled}
                className="h-4 w-4 rounded border-border bg-black/20 accent-[#7dff67]"
              />
              允许其他成员在帖子下发表评论
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <SubmitButton
                label="保存修改"
                pendingLabel="提交中..."
                className="rounded-full border border-accent/25 bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#081109] hover:-translate-y-0.5 hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
              />
              <Link
                href={`/posts/${post.id}`}
                className="inline-flex rounded-full border border-border bg-black/20 px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-white hover:border-accent/45 hover:text-accent"
              >
                取消返回
              </Link>
            </div>
          </form>
        </Panel>

        <Panel className="p-6 sm:p-8">
          <p className="eyebrow">编辑说明</p>
          <div className="mt-5 space-y-4 text-sm leading-7 text-muted">
            <p>修改会立即生效，已发布的帖子不需要重新审核。</p>
            <p>把状态改回“保存草稿”，帖子会从公开列表撤下，只有你和管理员可见。</p>
            <p>更换封面后，旧封面文件会被自动清理。</p>
            <p>如果帖子被管理员隐藏或归档，保存修改会把它恢复为所选状态。</p>
          </div>
        </Panel>
      </section>
    </div>
  );
}