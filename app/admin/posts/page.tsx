import Link from "next/link";
import { adminDeletePost, adminUpdatePost } from "@/app/admin/actions";
import { AdminPagination } from "@/components/admin-pagination";
import { ConfirmSubmitButton } from "@/components/auth/confirm-submit-button";
import { SubmitButton } from "@/components/auth/submit-button";
import { PageHero } from "@/components/page-hero";
import { Panel } from "@/components/panel";
import { formatAdminDate, getAdminPosts } from "@/lib/admin";

type AdminPostsPageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
    page?: string;
  }>;
};

export default async function AdminPostsPage({
  searchParams,
}: AdminPostsPageProps) {
  const { message, error, page } = await searchParams;
  const postsPage = await getAdminPosts(page);
  const posts = postsPage.items;

  return (
    <>
      <PageHero
        eyebrow="ADMIN / POSTS"
        title="帖子管理"
        description="维护帖子状态、阅读范围与评论开关，集中处理社区内容。"
      />

      {message ? (
        <Panel className="p-5">
          <p className="text-sm leading-7 text-white">{message}</p>
        </Panel>
      ) : null}
      {error ? (
        <Panel className="border-rose-400/20 bg-rose-400/10 p-5">
          <p className="text-sm leading-7 text-rose-100">{error}</p>
        </Panel>
      ) : null}

      <section className="grid gap-4">
        {posts.map((post) => (
          <Panel key={post.id} className="p-6">
            <div className="grid gap-5 xl:grid-cols-[1.15fr_0.95fr_0.45fr]">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/posts/${post.id}`}
                    className="font-display text-2xl uppercase tracking-[0.12em] text-white hover:text-accent"
                  >
                    {post.title}
                  </Link>
                  <span className="rounded-full border border-white/[0.08] px-3 py-1 text-xs uppercase tracking-[0.22em] text-muted">
                    {post.statusLabel}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-muted">
                  作者 {post.authorName} / {post.visibilityLabel}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted">
                  创建 {formatAdminDate(post.createdAt)} / 更新{" "}
                  {formatAdminDate(post.updatedAt)}
                </p>
              </div>

              <form action={adminUpdatePost} className="grid gap-3">
                <input type="hidden" name="post_id" value={post.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.22em] text-muted">
                      帖子状态
                    </span>
                    <select
                      name="status"
                      defaultValue={post.status}
                      className="rounded-[20px] border border-border bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-accent/45"
                    >
                      <option value="draft">draft</option>
                      <option value="published">published</option>
                      <option value="hidden">hidden</option>
                      <option value="archived">archived</option>
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.22em] text-muted">
                      可见范围
                    </span>
                    <select
                      name="visibility"
                      defaultValue={post.visibility}
                      className="rounded-[20px] border border-border bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-accent/45"
                    >
                      <option value="public">public</option>
                      <option value="members">members</option>
                    </select>
                  </label>
                </div>

                <label className="flex items-center gap-3 rounded-[20px] border border-border bg-black/20 px-4 py-3 text-sm text-white">
                  <input
                    type="checkbox"
                    name="comments_enabled"
                    defaultChecked={post.commentsEnabled}
                    className="h-4 w-4 rounded border-border bg-black/20 accent-[#7dff67]"
                  />
                  允许评论
                </label>

                <SubmitButton
                  label="保存帖子设置"
                  pendingLabel="提交中..."
                  className="w-fit rounded-full border border-border bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-accent/45 hover:text-accent disabled:cursor-not-allowed disabled:opacity-70"
                />
              </form>

              <form
                action={adminDeletePost}
                className="flex items-start xl:justify-end"
              >
                <input type="hidden" name="post_id" value={post.id} />
                <ConfirmSubmitButton
                  label="删除帖子"
                  pendingLabel="删除中..."
                  confirmMessage={`确定要删除帖子「${post.title}」吗？评论和点赞会一并删除，且无法恢复。`}
                  className="rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-100 hover:border-rose-400/35 hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-70"
                />
              </form>
            </div>
          </Panel>
        ))}
        {postsPage.total === 0 ? (
          <Panel className="p-6">
            <p className="text-sm leading-7 text-muted">暂无帖子数据。</p>
          </Panel>
        ) : null}
      </section>

      <AdminPagination
        basePath="/admin/posts"
        page={postsPage.page}
        totalPages={postsPage.totalPages}
        total={postsPage.total}
      />
    </>
  );
}
