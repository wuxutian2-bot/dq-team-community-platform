import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createComment, deleteComment, deletePost, toggleLike } from "@/app/posts/actions";
import { ConfirmSubmitButton } from "@/components/auth/confirm-submit-button";
import { SubmitButton } from "@/components/auth/submit-button";
import { PageHero } from "@/components/page-hero";
import { Panel } from "@/components/panel";
import { buildRedirectPath, getAuthContext } from "@/lib/auth";
import { getPostInteractions } from "@/lib/post-interactions";
import { formatPostDate, getPostById } from "@/lib/posts";

type PostDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
};

export default async function PostDetailPage({
  params,
  searchParams,
}: PostDetailPageProps) {
  const [{ id }, query, auth] = await Promise.all([
    params,
    searchParams,
    getAuthContext(),
  ]);
  const postId = Number(id);

  if (!Number.isInteger(postId) || postId <= 0) {
    notFound();
  }

  const [post, interactions] = await Promise.all([
    getPostById(postId),
    getPostInteractions(postId, auth.user?.id ?? null),
  ]);

  if (!post) {
    notFound();
  }

  const isOwner = auth.user?.id === post.authorId;
  const canManagePost =
    isOwner ||
    (auth.profile?.status === "active" &&
      (auth.profile?.role_level ?? 99) <= 2);
  const canParticipate =
    Boolean(auth.user) &&
    auth.profile?.status === "active" &&
    (auth.profile?.role_level ?? 99) <= 3;
  const interactionsOpen = post.status === "published";
  const commentLoginHref = buildRedirectPath("/login", {
    next: `/posts/${post.id}`,
  });

  return (
    <div className="page-shell post-detail-page">
      <PageHero
        eyebrow={`POST DETAIL // ${post.statusLabel}`}
        title={post.title}
        description={post.excerpt || "记录对局的思考，也听见队友的声音。"}
      />

      {query.message ? (
        <Panel className="p-5">
          <p className="text-sm leading-7 text-white">{query.message}</p>
        </Panel>
      ) : null}

      {query.error ? (
        <Panel className="border-rose-400/20 bg-rose-400/10 p-5">
          <p className="text-sm leading-7 text-rose-100">{query.error}</p>
        </Panel>
      ) : null}

      <section className="grid post-detail-layout">
        <div className="post-main-column">
          <Panel className="post-reading p-6 sm:p-8">
            {post.coverImageUrl ? (
              <div className="mb-6 overflow-hidden rounded-[28px] border border-white/[0.06]">
                <Image
                  src={post.coverImageUrl}
                  alt={`${post.title} cover`}
                  width={1400}
                  height={720}
                  className="h-72 w-full object-cover"
                />
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-accent/20 bg-accent/[0.08] px-3 py-1 text-xs uppercase tracking-normal text-accent">
                {post.visibilityLabel}
              </span>
              <span className="rounded-full border border-white/[0.08] px-3 py-1 text-xs uppercase tracking-normal text-muted">
                {post.statusLabel}
              </span>
              <span className="text-xs uppercase tracking-normal text-muted">
                {formatPostDate(post.createdAt)}
              </span>
            </div>

            <div className="post-body mt-6 space-y-5 text-base leading-8 text-white/90">
              {post.content.split(/\n{2,}/).map((paragraph, index) => (
                <p key={`${post.id}-${index}`} className="whitespace-pre-wrap">
                  {paragraph}
                </p>
              ))}
            </div>
          </Panel>

          <Panel className="post-discussion p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="post-comments-title">评论区</h2>
                <p className="mt-3 text-sm leading-7 text-muted">
                  说说你的看法，也欢迎分享补充思路。
                </p>
              </div>
              <div className="rounded-full border border-white/[0.08] px-4 py-2 text-sm uppercase tracking-normal text-muted">
                共 {interactions.commentsCount} 条评论
              </div>
            </div>

            {interactionsOpen &&
            auth.isConfigured &&
            auth.user &&
            canParticipate ? (
              post.commentsEnabled ? (
                <form action={createComment} className="mt-6 grid gap-4">
                  <input type="hidden" name="post_id" value={post.id} />
                  <label className="grid gap-2">
                    <span className="text-sm uppercase tracking-normal text-muted">
                      发表评论
                    </span>
                    <textarea
                      name="content"
                      rows={5}
                      maxLength={2000}
                      placeholder="写下你的看法、建议，或者对这篇帖子的补充。"
                      className="rounded-lg border border-border bg-black/25 px-5 py-4 text-base leading-7 text-white outline-none ring-0 placeholder:text-muted focus:border-accent/45"
                      required
                    />
                  </label>
                  <SubmitButton
                    label="发布评论"
                    pendingLabel="发布中..."
                    className="w-fit rounded-full border border-accent/25 bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-normal text-[#081109] hover:-translate-y-0.5 hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </form>
              ) : (
                <div className="mt-6 rounded-lg border border-border bg-black/20 px-5 py-4 text-sm leading-7 text-muted">
                  作者当前关闭了评论功能，因此这篇帖子暂时不能新增评论。
                </div>
              )
            ) : null}

            <div className="mt-8 grid gap-4">
              {interactions.comments.length > 0 ? (
                interactions.comments.map((comment) => {
                  const canDeleteComment =
                    canParticipate &&
                    (comment.authorId === auth.user?.id ||
                      (auth.profile?.role_level ?? 99) <= 2);

                  return (
                    <div
                      key={comment.id}
                      className="rounded-lg border border-border bg-black/20 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="text-sm font-semibold uppercase tracking-normal text-white">
                              {comment.authorName}
                            </p>
                            <span className="rounded-full border border-white/[0.08] px-3 py-1 text-xs uppercase tracking-normal text-muted">
                              {comment.authorRole}
                            </span>
                          </div>
                          <p className="mt-2 text-xs uppercase tracking-normal text-muted">
                            {formatPostDate(comment.createdAt)}
                          </p>
                        </div>

                        {canDeleteComment && auth.isConfigured ? (
                          <form action={deleteComment}>
                            <input
                              type="hidden"
                              name="post_id"
                              value={post.id}
                            />
                            <input
                              type="hidden"
                              name="comment_id"
                              value={comment.id}
                            />
                            <ConfirmSubmitButton
                              label="删除评论"
                              pendingLabel="处理中..."
                              confirmMessage="确定要删除这条评论吗？删除后无法恢复。"
                              className="rounded-full border border-white/[0.08] bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-normal text-muted hover:border-rose-400/30 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                            />
                          </form>
                        ) : null}
                      </div>

                      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/90">
                        {comment.content}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-lg border border-border bg-black/20 p-5 text-sm leading-7 text-muted">
                  还没有评论。留下你的想法，开启这场讨论。
                </div>
              )}
            </div>
          </Panel>
        </div>
        <div className="post-side-column">
          <Panel className="p-6 post-author-card">
            <h2>关于作者</h2>
            <p className="post-author-name">{post.authorName}</p>
            <p className="post-author-role">{post.authorRole}</p>
            <dl className="post-author-meta">
              <div>
                <dt>阅读时间</dt>
                <dd>约 {post.readingMinutes} 分钟</dd>
              </div>
              <div>
                <dt>发布时间</dt>
                <dd>{formatPostDate(post.createdAt)}</dd>
              </div>
            </dl>
          </Panel>

          <Panel className="p-6">
            <p className="eyebrow">社区互动</p>
            <div className="mt-5 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-black/20 px-4 py-4 text-sm text-white">
                  <p className="text-xs uppercase tracking-normal text-muted">
                    点赞数
                  </p>
                  <p className="mt-2 font-display text-2xl uppercase tracking-normal">
                    {interactions.likesCount}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-black/20 px-4 py-4 text-sm text-white">
                  <p className="text-xs uppercase tracking-normal text-muted">
                    评论数
                  </p>
                  <p className="mt-2 font-display text-2xl uppercase tracking-normal">
                    {interactions.commentsCount}
                  </p>
                </div>
              </div>

              {!interactionsOpen ? (
                <div className="rounded-lg border border-border bg-black/20 px-4 py-4 text-sm leading-7 text-muted">
                  当前帖子还不是已发布状态，因此评论和点赞暂时关闭。等帖子公开发布后，成员才可以参与互动。
                </div>
              ) : !auth.isConfigured ? (
                <div className="rounded-lg border border-border bg-black/20 px-4 py-4 text-sm leading-7 text-muted">
                  当前展示的是演示内容，暂不支持评论和点赞。
                </div>
              ) : !auth.user ? (
                <div className="rounded-lg border border-border bg-black/20 px-4 py-4 text-sm leading-7 text-muted">
                  游客可以阅读公开评论，但需要先
                  <Link
                    href={commentLoginHref}
                    className="mx-1 text-accent hover:text-accent-strong"
                  >
                    登录成员账号
                  </Link>
                  才能点赞或发表评论。
                </div>
              ) : !canParticipate ? (
                <div className="rounded-lg border border-border bg-black/20 px-4 py-4 text-sm leading-7 text-muted">
                  当前账号暂时无法参与讨论，请联系管理员确认成员状态。
                </div>
              ) : (
                <form action={toggleLike} className="grid gap-3">
                  <input type="hidden" name="post_id" value={post.id} />
                  <SubmitButton
                    label={
                      interactions.viewerHasLiked ? "取消点赞" : "点赞支持"
                    }
                    pendingLabel="处理中..."
                    className="rounded-full border border-accent/25 bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-normal text-[#081109] hover:-translate-y-0.5 hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </form>
              )}

              {canManagePost && auth.isConfigured ? (
                <div className="grid gap-3 rounded-lg border border-accent/20 bg-accent/[0.08] px-4 py-4">
                  <p className="text-sm leading-7 text-white">
                    {isOwner
                      ? "这是你发布的帖子，可以随时编辑内容或删除。"
                      : "你是管理员，可以编辑或删除这篇帖子。"}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/posts/${post.id}/edit`}
                      className="inline-flex rounded-full border border-accent/25 bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-normal text-[#081109] hover:-translate-y-0.5 hover:bg-accent-strong"
                    >
                      编辑帖子
                    </Link>
                    <form action={deletePost}>
                      <input type="hidden" name="post_id" value={post.id} />
                      <ConfirmSubmitButton
                        label="删除帖子"
                        pendingLabel="删除中..."
                        confirmMessage="确定要删除这篇帖子吗？帖子下的评论和点赞会一并删除，且无法恢复。"
                        className="rounded-full border border-rose-400/25 bg-rose-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-normal text-rose-100 hover:border-rose-400/40 hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-70"
                      />
                    </form>
                  </div>
                </div>
              ) : null}

              <Link
                href="/posts"
                className="inline-flex rounded-full border border-border bg-black/20 px-4 py-2 text-sm font-semibold uppercase tracking-normal text-white hover:border-accent/[0.45] hover:text-accent"
              >
                返回帖子列表
              </Link>
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}
