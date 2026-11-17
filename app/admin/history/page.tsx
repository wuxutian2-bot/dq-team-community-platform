import {
  adminCreateTeamEvent,
  adminDeleteTeamEvent,
  adminSeedDefaultHistory,
  adminUpdateTeamEvent,
} from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/auth/confirm-submit-button";
import { SubmitButton } from "@/components/auth/submit-button";
import { PageHero } from "@/components/page-hero";
import { Panel } from "@/components/panel";
import { formatAdminDate, getAdminHistoryItems } from "@/lib/admin";

type AdminHistoryPageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

export default async function AdminHistoryPage({
  searchParams,
}: AdminHistoryPageProps) {
  const [{ message, error }, events] = await Promise.all([
    searchParams,
    getAdminHistoryItems(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="ADMIN / HISTORY"
        title="成长史管理"
        description="整理战队历程中的重要节点，设置日期、展示顺序与发布范围。"
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

      <Panel className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="eyebrow">Default Seed</p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
            如果你想把当前默认的 S19-S42 成长史正式写进 Supabase，
            可以直接点下面这个按钮。这个导入只会在数据库为空时执行，
            避免把你后续手工维护的成长史重复灌进去。
          </p>
        </div>

        <form action={adminSeedDefaultHistory}>
          <ConfirmSubmitButton
            label="导入默认 S19-S42"
            pendingLabel="导入中..."
            confirmMessage="确定要导入默认 S19-S42 成长史吗？仅在数据库为空时才会写入。"
            className="w-fit rounded-full border border-accent/25 bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#081109] hover:-translate-y-0.5 hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
          />
        </form>
      </Panel>

      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <Panel className="p-6 sm:p-8">
          <p className="eyebrow">新增成长节点</p>
          <form action={adminCreateTeamEvent} className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                标题
              </span>
              <input
                type="text"
                name="title"
                maxLength={120}
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base text-white outline-none placeholder:text-muted focus:border-accent/45"
                placeholder="例如：完成第一次公开招募"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                摘要
              </span>
              <textarea
                name="summary"
                rows={3}
                maxLength={280}
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base leading-7 text-white outline-none placeholder:text-muted focus:border-accent/45"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                正文说明
              </span>
              <textarea
                name="content"
                rows={6}
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base leading-7 text-white outline-none placeholder:text-muted focus:border-accent/45"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                节点日期
              </span>
              <input
                type="date"
                name="event_date"
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base text-white outline-none focus:border-accent/45"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                赛季编号（可选）
              </span>
              <input
                type="text"
                name="season_code"
                maxLength={4}
                pattern="[Ss][0-9]{1,3}"
                title="S 加 1 到 3 位数字，例如 S43"
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base text-white outline-none placeholder:text-muted focus:border-accent/45"
                placeholder="例如：S43，非赛季节点可留空"
              />
            </label>

            <label className="flex items-center gap-3 rounded-[20px] border border-border bg-black/20 px-4 py-3 text-sm text-white">
              <input
                type="checkbox"
                name="is_public"
                defaultChecked
                className="h-4 w-4 rounded border-border bg-black/20 accent-[#7dff67]"
              />
              对外公开
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
              label="创建成长节点"
              pendingLabel="创建中..."
              className="w-fit rounded-full border border-accent/25 bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#081109] hover:-translate-y-0.5 hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
            />
          </form>
        </Panel>

        <Panel className="p-6 sm:p-8">
          <p className="eyebrow">发布说明</p>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-border bg-black/20 px-4 py-4 text-sm leading-7 text-muted">
              “公开 + 已发布”的节点会显示在前台成长史页面。
            </div>
            <div className="rounded-2xl border border-border bg-black/20 px-4 py-4 text-sm leading-7 text-muted">
              “不公开”适合内部筹备内容，“未发布”适合还没整理完成的节点草稿。
            </div>
            <div className="rounded-2xl border border-border bg-black/20 px-4 py-4 text-sm leading-7 text-muted">
              第十步接入图片上传后，我们会把封面图字段接进这条管理链路。
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4">
        {events.map((event) => (
          <Panel key={event.id} className="p-6">
            <div className="grid gap-5 xl:grid-cols-[1.15fr_0.95fr_0.45fr]">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-display text-2xl uppercase tracking-[0.12em] text-white">
                    {event.title}
                  </p>
                  {event.seasonCode ? (
                    <span className="rounded-full border border-accent/25 px-3 py-1 text-xs uppercase tracking-[0.22em] text-accent">
                      {event.seasonCode}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-white/[0.08] px-3 py-1 text-xs uppercase tracking-[0.22em] text-muted">
                    {event.visibilityLabel}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-white/90">
                  {event.summary}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted">
                  节点时间 {formatAdminDate(event.eventDate)}
                </p>
              </div>

              <form action={adminUpdateTeamEvent} className="grid gap-3">
                <input type="hidden" name="event_id" value={event.id} />
                <label className="flex items-center gap-3 rounded-[20px] border border-border bg-black/20 px-4 py-3 text-sm text-white">
                  <input
                    type="checkbox"
                    name="is_public"
                    defaultChecked={event.isPublic}
                    className="h-4 w-4 rounded border-border bg-black/20 accent-[#7dff67]"
                  />
                  对外公开
                </label>
                <label className="flex items-center gap-3 rounded-[20px] border border-border bg-black/20 px-4 py-3 text-sm text-white">
                  <input
                    type="checkbox"
                    name="is_published"
                    defaultChecked={event.isPublished}
                    className="h-4 w-4 rounded border-border bg-black/20 accent-[#7dff67]"
                  />
                  已发布
                </label>
                <SubmitButton
                  label="更新节点状态"
                  pendingLabel="提交中..."
                  className="w-fit rounded-full border border-border bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-accent/45 hover:text-accent disabled:cursor-not-allowed disabled:opacity-70"
                />
              </form>

              <form
                action={adminDeleteTeamEvent}
                className="flex items-start xl:justify-end"
              >
                <input type="hidden" name="event_id" value={event.id} />
                <ConfirmSubmitButton
                  label="删除节点"
                  pendingLabel="删除中..."
                  confirmMessage={`确定要删除成长节点「${event.title}」吗？删除后无法恢复。`}
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
