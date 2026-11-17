import Link from "next/link";
import { adminUpdateCommentStatus } from "@/app/admin/actions";
import { AdminPagination } from "@/components/admin-pagination";
import { SubmitButton } from "@/components/auth/submit-button";
import { PageHero } from "@/components/page-hero";
import { Panel } from "@/components/panel";
import { formatAdminDate, getAdminComments } from "@/lib/admin";

type AdminCommentsPageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
    page?: string;
  }>;
};

export default async function AdminCommentsPage({
  searchParams,
}: AdminCommentsPageProps) {
  const { message, error, page } = await searchParams;
  const commentsPage = await getAdminComments(page);
  const comments = commentsPage.items;

  return (
    <>
      <PageHero
        eyebrow="ADMIN / COMMENTS"
        title="评论管理"
        description="查看讨论上下文，处理需要隐藏或删除的评论。"
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
        {comments.map((comment) => (
          <Panel key={comment.id} className="p-6">
            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-display text-2xl uppercase tracking-[0.12em] text-white">
                    {comment.authorName}
                  </p>
                  <span className="rounded-full border border-white/[0.08] px-3 py-1 text-xs uppercase tracking-[0.22em] text-muted">
                    {comment.statusLabel}
                  </span>
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/90">
                  {comment.content}
                </p>
                <p className="mt-4 text-sm leading-7 text-muted">
                  所属帖子：
                  <Link
                    href={`/posts/${comment.postId}`}
                    className="ml-1 text-white hover:text-accent"
                  >
                    {comment.postTitle}
                  </Link>
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted">
                  评论时间 {formatAdminDate(comment.createdAt)}
                </p>
              </div>

              <form action={adminUpdateCommentStatus} className="grid gap-3">
                <input type="hidden" name="comment_id" value={comment.id} />
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.22em] text-muted">
                    评论状态
                  </span>
                  <select
                    name="status"
                    defaultValue={comment.status}
                    className="rounded-[20px] border border-border bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-accent/45"
                  >
                    <option value="visible">visible</option>
                    <option value="hidden">hidden</option>
                    <option value="deleted">deleted</option>
                  </select>
                </label>
                <SubmitButton
                  label="更新评论状态"
                  pendingLabel="提交中..."
                  className="w-fit rounded-full border border-border bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-accent/45 hover:text-accent disabled:cursor-not-allowed disabled:opacity-70"
                />
              </form>
            </div>
          </Panel>
        ))}
        {commentsPage.total === 0 ? (
          <Panel className="p-6">
            <p className="text-sm leading-7 text-muted">暂无评论数据。</p>
          </Panel>
        ) : null}
      </section>

      <AdminPagination
        basePath="/admin/comments"
        page={commentsPage.page}
        totalPages={commentsPage.totalPages}
        total={commentsPage.total}
      />
    </>
  );
}
