export const metadata = { title: "发布帖子" };

import { redirect } from "next/navigation";
import { createPost } from "@/app/posts/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { ImageFileInput } from "@/components/image-file-input";
import { PageHero } from "@/components/page-hero";
import { Panel } from "@/components/panel";
import { PostDraftGuard } from "@/components/post-draft-guard";
import { buildRedirectPath, getAuthContext } from "@/lib/auth";

type CreatePostPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function CreatePostPage({
  searchParams,
}: CreatePostPageProps) {
  const params = await searchParams;
  const { isConfigured, user, profile } = await getAuthContext();

  if (!isConfigured) {
    return (
      <div className="page-shell">
        <PageHero
          eyebrow="CREATE POST"
          title="发布帖子"
          description="发帖服务暂未启用，请稍后重试或联系管理员。"
        />
        <Panel className="p-6 sm:p-8">
          <p className="text-sm leading-7 text-muted">
            你可以先浏览已有的公开讨论。服务恢复后，成员就能在这里发布内容。
          </p>
        </Panel>
      </div>
    );
  }

  if (!user) {
    redirect(
      buildRedirectPath("/login", {
        next: "/posts/create",
        error: "请先登录后再发布帖子。",
      }),
    );
  }

  if (!profile || profile.status !== "active" || profile.role_level > 3) {
    return (
      <div className="page-shell">
        <PageHero
          eyebrow="CREATE POST"
          title="发布帖子"
          description="当前账号还没有发帖权限。只有已激活的正式成员、副队和队长可以发布帖子。"
        />
        <Panel className="p-6 sm:p-8">
          <p className="text-sm leading-7 text-muted">
            如果刚拿到成员账号但仍然无法发帖，请联系管理员确认账号是否已经激活。
          </p>
        </Panel>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <PageHero
        eyebrow="CREATE POST"
        title="发布帖子"
        description="写下这一次的思考。可以先存为草稿，或选择让所有访客、仅战队成员阅读。"
      />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_290px]">
        <Panel className="p-6 sm:p-8">
          {params.error ? (
            <div className="rounded-[22px] border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm leading-7 text-rose-100">
              {params.error}
            </div>
          ) : null}

          <form action={createPost} className="mt-5 grid gap-4">
            <PostDraftGuard hasError={Boolean(params.error)} />
            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                帖子标题
              </span>
              <input
                type="text"
                name="title"
                maxLength={120}
                placeholder="这周训练后我们修正了哪些团队问题？"
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
                placeholder="用 1-2 段简短文字概括这篇帖子的重点。"
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base leading-7 text-white outline-none ring-0 placeholder:text-muted focus:border-accent/45"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                帖子封面
              </span>
              <ImageFileInput
                name="cover_image"
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.18em] file:text-[#081109]"
              />
              <span className="text-xs leading-6 text-muted">
                可选。支持 JPG、PNG、WEBP，大小不超过 5MB。
              </span>
            </label>

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                正文
              </span>
              <textarea
                name="content"
                rows={12}
                placeholder="记录这篇帖子的完整内容。可以是训练复盘、成员心得、招募说明或战队公告草稿。"
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
                  defaultValue="public"
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
                  defaultValue="published"
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
                defaultChecked
                className="h-4 w-4 rounded border-border bg-black/20 accent-[#7dff67]"
              />
              允许其他成员在帖子下发表评论
            </label>

            <SubmitButton
              label="保存帖子"
              pendingLabel="提交中..."
              className="rounded-full border border-accent/25 bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#081109] hover:-translate-y-0.5 hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
            />
          </form>
        </Panel>

        <Panel className="p-6 sm:p-8">
          <p className="eyebrow">发布说明</p>
          <div className="mt-5 space-y-4 text-sm leading-7 text-muted">
            <p>先写下想法，整理好再发布。封面图可以让帖子更容易被队友发现。</p>
            <p>输入内容会自动保存在本机浏览器中，提交失败或中途离开后可以回来继续写。</p>
            <p>如果选择“仅成员可见”，游客不会在列表页看到这篇帖子。</p>
            <p>如果保存为草稿，只有你本人和后台管理员能通过可见范围看到它。</p>
            <p>帖子发布后，评论和点赞已经可以在详情页继续承接社区互动。</p>
          </div>
        </Panel>
      </section>
    </div>
  );
}
