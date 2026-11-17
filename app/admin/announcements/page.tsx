import {
  adminCreateAnnouncement,
  adminDeleteAnnouncement,
  adminUpdateAnnouncement,
} from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/auth/confirm-submit-button";
import { SubmitButton } from "@/components/auth/submit-button";
import { PageHero } from "@/components/page-hero";
import { Panel } from "@/components/panel";
import { formatAdminDate, getAdminAnnouncements } from "@/lib/admin";

type AdminAnnouncementsPageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

export default async function AdminAnnouncementsPage({
  searchParams,
}: AdminAnnouncementsPageProps) {
  const [{ message, error }, announcements] = await Promise.all([
    searchParams,
    getAdminAnnouncements(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="ADMIN / ANNOUNCEMENTS"
        title="公告管理"
        description="维护站点通知，设置受众、置顶状态与生效时间。"
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

      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <Panel className="p-6 sm:p-8">
          <p className="eyebrow">发布新公告</p>
          <form action={adminCreateAnnouncement} className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                标题
              </span>
              <input
                type="text"
                name="title"
                maxLength={120}
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base text-white outline-none placeholder:text-muted focus:border-accent/45"
                placeholder="例如：本周训练安排调整"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                正文
              </span>
              <textarea
                name="content"
                rows={6}
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base leading-7 text-white outline-none placeholder:text-muted focus:border-accent/45"
                required
              />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm uppercase tracking-[0.22em] text-muted">
                  受众
                </span>
                <select
                  name="audience"
                  defaultValue="public"
                  className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base text-white outline-none focus:border-accent/45"
                >
                  <option value="public">public</option>
                  <option value="members">members</option>
                  <option value="admins">admins</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm uppercase tracking-[0.22em] text-muted">
                  开始时间
                </span>
                <input
                  type="datetime-local"
                  name="starts_at"
                  className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base text-white outline-none focus:border-accent/45"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm uppercase tracking-[0.22em] text-muted">
                  结束时间
                </span>
                <input
                  type="datetime-local"
                  name="ends_at"
                  className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base text-white outline-none focus:border-accent/45"
                />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-[20px] border border-border bg-black/20 px-4 py-3 text-sm text-white">
              <input
                type="checkbox"
                name="is_pinned"
                className="h-4 w-4 rounded border-border bg-black/20 accent-[#7dff67]"
              />
              置顶展示
            </label>

            <label className="flex items-center gap-3 rounded-[20px] border border-border bg-black/20 px-4 py-3 text-sm text-white">
              <input
                type="checkbox"
                name="is_published"
                defaultChecked
                className="h-4 w-4 rounded border-border bg-black/20 accent-[#7dff67]"
              />
              立即发布
            </label>

            <SubmitButton
              label="创建公告"
              pendingLabel="创建中..."
              className="w-fit rounded-full border border-accent/25 bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#081109] hover:-translate-y-0.5 hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
            />
          </form>
        </Panel>

        <Panel className="p-6 sm:p-8">
          <p className="eyebrow">运行说明</p>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-border bg-black/20 px-4 py-4 text-sm leading-7 text-muted">
              受众可分为公开、成员和管理员三档，适合不同范围的运营通知。
            </div>
            <div className="rounded-2xl border border-border bg-black/20 px-4 py-4 text-sm leading-7 text-muted">
              置顶公告会优先排在列表前面，适合训练改期、招募提醒和活动预告。
            </div>
            <div className="rounded-2xl border border-border bg-black/20 px-4 py-4 text-sm leading-7 text-muted">
              公告会按照受众、生效时间和发布状态保存。请确认站点相应页面已经配置公告展示位置。
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4">
        {announcements.map((announcement) => (
          <Panel key={announcement.id} className="p-6">
            <div className="grid gap-5 xl:grid-cols-[1.15fr_0.95fr_0.45fr]">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-display text-2xl uppercase tracking-[0.12em] text-white">
                    {announcement.title}
                  </p>
                  <span className="rounded-full border border-white/[0.08] px-3 py-1 text-xs uppercase tracking-[0.22em] text-muted">
                    {announcement.statusLabel}
                  </span>
                  <span className="rounded-full border border-white/[0.08] px-3 py-1 text-xs uppercase tracking-[0.22em] text-muted">
                    {announcement.audienceLabel}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-white/90">
                  {announcement.content}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted">
                  创建时间 {formatAdminDate(announcement.createdAt)}
                </p>
              </div>

              <form action={adminUpdateAnnouncement} className="grid gap-3">
                <input
                  type="hidden"
                  name="announcement_id"
                  value={announcement.id}
                />
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.22em] text-muted">
                    受众
                  </span>
                  <select
                    name="audience"
                    defaultValue={announcement.audience}
                    className="rounded-[20px] border border-border bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-accent/45"
                  >
                    <option value="public">public</option>
                    <option value="members">members</option>
                    <option value="admins">admins</option>
                  </select>
                </label>
                <label className="flex items-center gap-3 rounded-[20px] border border-border bg-black/20 px-4 py-3 text-sm text-white">
                  <input
                    type="checkbox"
                    name="is_pinned"
                    defaultChecked={announcement.isPinned}
                    className="h-4 w-4 rounded border-border bg-black/20 accent-[#7dff67]"
                  />
                  置顶展示
                </label>
                <label className="flex items-center gap-3 rounded-[20px] border border-border bg-black/20 px-4 py-3 text-sm text-white">
                  <input
                    type="checkbox"
                    name="is_published"
                    defaultChecked={announcement.isPublished}
                    className="h-4 w-4 rounded border-border bg-black/20 accent-[#7dff67]"
                  />
                  已发布
                </label>
                <SubmitButton
                  label="更新公告"
                  pendingLabel="提交中..."
                  className="w-fit rounded-full border border-border bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-accent/45 hover:text-accent disabled:cursor-not-allowed disabled:opacity-70"
                />
              </form>

              <form
                action={adminDeleteAnnouncement}
                className="flex items-start xl:justify-end"
              >
                <input
                  type="hidden"
                  name="announcement_id"
                  value={announcement.id}
                />
                <ConfirmSubmitButton
                  label="删除公告"
                  pendingLabel="删除中..."
                  confirmMessage={`确定要删除公告「${announcement.title}」吗？删除后无法恢复。`}
                  className="rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-100 hover:border-rose-400/35 hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-70"
                />
              </form>
            </div>
          </Panel>
        ))}
      </section>
    </>
  );
}
