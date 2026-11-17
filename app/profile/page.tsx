export const metadata = { title: "个人中心" };

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { changePassword, updateProfile } from "@/app/profile/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { ImageFileInput } from "@/components/image-file-input";
import { PageHero } from "@/components/page-hero";
import { Panel } from "@/components/panel";
import { PasswordInput } from "@/components/password-input";
import { buildRedirectPath, getAuthContext, getRoleLabel } from "@/lib/auth";
import { formatPostDate, getPostsByAuthor } from "@/lib/posts";
import { getStorageSignedUrl, STORAGE_BUCKETS } from "@/lib/storage";
import { getSuggestedTeamPosition, TEAM_POSITIONS } from "@/lib/team-positions";

type ProfilePageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const params = await searchParams;
  const { isConfigured, user, profile } = await getAuthContext();
  const avatarUrl = await getStorageSignedUrl(
    STORAGE_BUCKETS.avatars,
    profile?.avatar_path,
  );

  if (!isConfigured) {
    return (
      <div className="page-shell">
        <PageHero
          eyebrow="PLAYER CENTER"
          title="个人中心"
          description="个人资料服务暂未启用，请联系管理员。"
        />
        <Panel className="p-6 sm:p-8">
          <p className="text-sm leading-7 text-muted">
            服务恢复后，你可以在这里查看和编辑成员名片。
          </p>
        </Panel>
      </div>
    );
  }

  if (!user) {
    redirect(
      buildRedirectPath("/login", {
        next: "/profile",
        error: "请先登录后再进入个人中心。",
      }),
    );
  }

  if (!profile) {
    return (
      <div className="page-shell">
        <PageHero
          eyebrow="PLAYER CENTER"
          title="个人中心"
          description="你的账号已登录，但成员资料尚未就绪。"
        />
        <Panel className="p-6 sm:p-8">
          <p className="text-sm leading-7 text-muted">
            请联系战队管理员同步你的成员资料，然后重新进入个人中心。
          </p>
        </Panel>
      </div>
    );
  }

  const defaultPosition =
    profile.position_title ?? getSuggestedTeamPosition(profile.role_level);
  const canEditPosition = profile.role_level <= 2;
  const myPosts = await getPostsByAuthor(user.id);

  return (
    <div className="page-shell">
      <PageHero
        eyebrow="PLAYER CENTER"
        title="个人中心"
        description="管理你的成员名片。更新头像、昵称与常用游戏，也可以决定哪些资料向大家公开。战队职位由队长和副队维护。"
      />

      <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Panel className="p-6 sm:p-8">
          <p className="eyebrow">我的成员名片</p>

          {params.error ? (
            <div className="mt-5 rounded-[22px] border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm leading-7 text-rose-100">
              {params.error}
            </div>
          ) : null}

          {params.message ? (
            <div className="mt-5 rounded-[22px] border border-accent/20 bg-accent/[0.08] px-5 py-4 text-sm leading-7 text-white">
              {params.message}
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            <div className="rounded-[24px] border border-border bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">
                当前头像
              </p>
              <div className="mt-4 flex items-center gap-4">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={`${profile.display_name} avatar`}
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-[28px] border border-accent/20 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-accent/20 bg-accent/[0.08] font-display text-3xl uppercase tracking-[0.18em] text-accent">
                    {profile.display_name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <p className="text-sm leading-7 text-muted">
                  当前头像会同步显示在成员展示页和成员详情页。支持
                  JPG、PNG、WEBP，大小不超过 5MB。
                </p>
              </div>
            </div>

            {[
              { label: "登录邮箱", value: user.email ?? "未提供" },
              { label: "显示名称", value: profile.display_name ?? "待补充" },
              { label: "权限等级", value: getRoleLabel(profile.role_level) },
              { label: "当前职位", value: defaultPosition },
              {
                label: "账号状态",
                value:
                  { active: "正常", pending: "待激活", disabled: "已停用" }[
                    profile.status
                  ] ?? "未建档",
              },
              {
                label: "公开资料",
                value: profile.is_profile_public ? "公开" : "仅个人中心可见",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border bg-black/20 px-4 py-4"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-muted">
                  {item.label}
                </p>
                <p className="mt-2 break-all text-sm leading-6 text-white">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-6 sm:p-8">
          <p className="eyebrow">资料编辑</p>
          <form action={updateProfile} className="mt-5 grid gap-4">
            <input
              type="hidden"
              name="current_slug"
              value={profile.username ?? profile.id ?? ""}
            />

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                上传头像
              </span>
              <ImageFileInput
                name="avatar"
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.18em] file:text-[#081109]"
              />
              <span className="text-xs leading-6 text-muted">
                不上传新文件时，会保留当前头像。
              </span>
            </label>

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                显示名称
              </span>
              <input
                type="text"
                name="display_name"
                defaultValue={profile.display_name ?? ""}
                maxLength={40}
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base text-white outline-none ring-0 placeholder:text-muted focus:border-accent/45"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                公开用户名
              </span>
              <input
                type="text"
                name="username"
                defaultValue={profile.username ?? ""}
                maxLength={24}
                placeholder="zero_captain"
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base text-white outline-none ring-0 placeholder:text-muted focus:border-accent/45"
              />
              <span className="text-xs leading-6 text-muted">
                可选。填写后成员详情页会优先使用这个地址标识，例如
                /members/zero_captain。
              </span>
            </label>

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                战队职位
              </span>
              {canEditPosition ? (
                <select
                  name="position_title"
                  defaultValue={defaultPosition}
                  className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base text-white outline-none ring-0 focus:border-accent/45"
                >
                  {TEAM_POSITIONS.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <input
                    type="hidden"
                    name="position_title"
                    value={defaultPosition}
                  />
                  <div className="rounded-[22px] border border-border bg-black/20 px-5 py-4 text-base text-white/90">
                    {defaultPosition}
                  </div>
                </>
              )}
              <span className="text-xs leading-6 text-muted">
                {canEditPosition
                  ? "职位用于成员展示和帖子署名，不改变账号的管理权限。"
                  : "战队职位由队长和副队维护。如需调整，请联系管理员。"}
              </span>
            </label>

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                常用游戏 / 标签
              </span>
              <input
                type="text"
                name="favorite_game"
                defaultValue={profile.favorite_game ?? ""}
                maxLength={60}
                placeholder="战术指挥 / 训练复盘 / FPS"
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base text-white outline-none ring-0 placeholder:text-muted focus:border-accent/45"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                个人简介
              </span>
              <textarea
                name="bio"
                defaultValue={profile.bio ?? ""}
                maxLength={500}
                rows={6}
                placeholder="介绍一下你的位置、风格、加入战队后的成长方向。"
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base leading-7 text-white outline-none ring-0 placeholder:text-muted focus:border-accent/45"
              />
            </label>

            <label className="flex items-center gap-3 rounded-[22px] border border-border bg-black/20 px-5 py-4 text-sm text-white">
              <input
                type="checkbox"
                name="is_profile_public"
                defaultChecked={profile.is_profile_public ?? true}
                className="h-4 w-4 rounded border-border bg-black/20 accent-[#7dff67]"
              />
              允许在公开成员展示页中显示我的资料
            </label>

            <SubmitButton
              label="保存资料"
              pendingLabel="保存中..."
              className="rounded-full border border-accent/25 bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#081109] hover:-translate-y-0.5 hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
            />
          </form>
        </Panel>
      </section>

      <section className="grid gap-6">
        <Panel className="p-6 sm:p-8">
          <p className="eyebrow">账号安全</p>
          <p className="mt-4 text-sm leading-7 text-muted">
            修改登录密码。建议不要使用 QQ 号、生日等容易被猜到的信息；新密码至少 8 位。
          </p>
          <form
            action={changePassword}
            className="mt-5 grid max-w-xl gap-4"
          >
            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                新密码
              </span>
              <PasswordInput
                name="new_password"
                id="new-password"
                autoComplete="new-password"
                placeholder="至少 8 位"
                minLength={8}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                确认新密码
              </span>
              <PasswordInput
                name="confirm_password"
                id="confirm-password"
                autoComplete="new-password"
                placeholder="再输入一次新密码"
                minLength={8}
              />
            </label>
            <SubmitButton
              label="修改密码"
              pendingLabel="修改中..."
              className="w-fit rounded-full border border-accent/25 bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#081109] hover:-translate-y-0.5 hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
            />
          </form>
        </Panel>
      </section>

      <section className="grid gap-6">
        <Panel className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow">我的帖子</p>
              <p className="mt-4 text-sm leading-7 text-muted">
                共 {myPosts.length} 篇，包含草稿和仅成员可见的内容。
              </p>
            </div>
            <Link
              href="/posts/create"
              className="inline-flex rounded-full border border-accent/25 bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#081109] hover:-translate-y-0.5 hover:bg-accent-strong"
            >
              发布新帖子
            </Link>
          </div>

          {myPosts.length ? (
            <div className="mt-6 grid gap-3">
              {myPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-border bg-black/20 px-5 py-4"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/posts/${post.id}`}
                      className="block truncate text-base font-semibold text-white hover:text-accent"
                    >
                      {post.title}
                    </Link>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">
                      {formatPostDate(post.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-white/[0.08] px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted">
                      {post.statusLabel}
                    </span>
                    <span className="rounded-full border border-white/[0.08] px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted">
                      {post.visibilityLabel}
                    </span>
                    <Link
                      href={`/posts/${post.id}/edit`}
                      className="inline-flex rounded-full border border-border bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:border-accent/45 hover:text-accent"
                    >
                      编辑
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-[22px] border border-border bg-black/20 px-5 py-4 text-sm leading-7 text-muted">
              还没有发布过帖子。写一篇训练复盘或战队日常，让队友看到你的思考。
            </p>
          )}
        </Panel>
      </section>
    </div>
  );
}
