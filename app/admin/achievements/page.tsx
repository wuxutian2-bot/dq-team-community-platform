import Image from "next/image";
import {
  adminCreateAchievement,
  adminDeleteAchievement,
  adminUpdateAchievement,
} from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/auth/confirm-submit-button";
import { SubmitButton } from "@/components/auth/submit-button";
import { ImageFileInput } from "@/components/image-file-input";
import { PageHero } from "@/components/page-hero";
import { Panel } from "@/components/panel";
import { formatAchievementDate } from "@/lib/achievements";
import { getAdminAchievementItems } from "@/lib/admin";

type AdminAchievementsPageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

export default async function AdminAchievementsPage({
  searchParams,
}: AdminAchievementsPageProps) {
  const [{ message, error }, achievements] = await Promise.all([
    searchParams,
    getAdminAchievementItems(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="ADMIN / ACHIEVEMENTS"
        title="荣誉墙管理"
        description="维护赛事成果与高光档案，选择图片，并控制发布状态与公开范围。"
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
          <p className="eyebrow">新增荣誉条目</p>
          <form action={adminCreateAchievement} className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                标题
              </span>
              <input
                type="text"
                name="title"
                maxLength={120}
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base text-white outline-none placeholder:text-muted focus:border-accent/45"
                placeholder="例如：赛季冲榜突破"
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
                达成日期
              </span>
              <input
                type="date"
                name="achieved_at"
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base text-white outline-none focus:border-accent/45"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                荣誉图片
              </span>
              <ImageFileInput
                name="image_file"
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.18em] file:text-[#081109]"
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
              label="创建荣誉条目"
              pendingLabel="创建中..."
              className="w-fit rounded-full border border-accent/25 bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#081109] hover:-translate-y-0.5 hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
            />
          </form>
        </Panel>

        <Panel className="p-6 sm:p-8">
          <p className="eyebrow">展示说明</p>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-border bg-black/20 px-4 py-4 text-sm leading-7 text-muted">
              只有公开且已发布的荣誉会出现在前台荣誉墙页面。
            </div>
            <div className="rounded-2xl border border-border bg-black/20 px-4 py-4 text-sm leading-7 text-muted">
              适合先把荣誉文案和过程录入后台，等素材准备好后再统一发布。
            </div>
            <div className="rounded-2xl border border-border bg-black/20 px-4 py-4 text-sm leading-7 text-muted">
              可上传荣誉图片。发布前，请检查图片内容与公开范围是否正确。
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4">
        {achievements.map((achievement) => (
          <Panel key={achievement.id} className="p-6">
            <div className="grid gap-5 xl:grid-cols-[1.15fr_0.95fr_0.45fr]">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-display text-2xl uppercase tracking-[0.12em] text-white">
                    {achievement.title}
                  </p>
                  <span className="rounded-full border border-white/[0.08] px-3 py-1 text-xs uppercase tracking-[0.22em] text-muted">
                    {achievement.visibilityLabel}
                  </span>
                </div>
                {achievement.imageUrl ? (
                  <div className="mt-4 overflow-hidden rounded-[24px] border border-white/[0.06]">
                    <Image
                      src={achievement.imageUrl}
                      alt={`${achievement.title} image`}
                      width={1200}
                      height={520}
                      className="h-52 w-full object-cover"
                    />
                  </div>
                ) : null}
                <p className="mt-4 text-sm leading-7 text-white/90">
                  {achievement.summary}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted">
                  达成时间 {formatAchievementDate(achievement.achievedAt)}
                </p>
              </div>

              <form action={adminUpdateAchievement} className="grid gap-3">
                <input
                  type="hidden"
                  name="achievement_id"
                  value={achievement.id}
                />
                <label className="flex items-center gap-3 rounded-[20px] border border-border bg-black/20 px-4 py-3 text-sm text-white">
                  <input
                    type="checkbox"
                    name="is_public"
                    defaultChecked={achievement.isPublic}
                    className="h-4 w-4 rounded border-border bg-black/20 accent-[#7dff67]"
                  />
                  对外公开
                </label>
                <label className="flex items-center gap-3 rounded-[20px] border border-border bg-black/20 px-4 py-3 text-sm text-white">
                  <input
                    type="checkbox"
                    name="is_published"
                    defaultChecked={achievement.isPublished}
                    className="h-4 w-4 rounded border-border bg-black/20 accent-[#7dff67]"
                  />
                  已发布
                </label>
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.22em] text-muted">
                    更换图片
                  </span>
                  <ImageFileInput
                    name="image_file"
                    className="rounded-[20px] border border-border bg-black/25 px-4 py-3 text-xs text-white file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-[10px] file:font-semibold file:uppercase file:tracking-[0.14em] file:text-[#081109]"
                  />
                </label>
                <SubmitButton
                  label="更新荣誉状态"
                  pendingLabel="提交中..."
                  className="w-fit rounded-full border border-border bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-accent/45 hover:text-accent disabled:cursor-not-allowed disabled:opacity-70"
                />
              </form>

              <form
                action={adminDeleteAchievement}
                className="flex items-start xl:justify-end"
              >
                <input
                  type="hidden"
                  name="achievement_id"
                  value={achievement.id}
                />
                <ConfirmSubmitButton
                  label="删除条目"
                  pendingLabel="删除中..."
                  confirmMessage={`确定要删除荣誉「${achievement.title}」吗？删除后无法恢复。`}
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
