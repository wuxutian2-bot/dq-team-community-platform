import Link from "next/link";
import { notFound } from "next/navigation";
import {
  adminResetMemberPassword,
  adminUpdateUserDisplayNameOnDetail,
  adminUpdateUserJoinedAtOnDetail,
  adminUpdateUserPositionOnDetail,
  adminUpdateUserRoleOnDetail,
  adminUpdateUserStatusOnDetail,
} from "@/app/admin/actions";
import { ConfirmSubmitButton } from "@/components/auth/confirm-submit-button";
import { SubmitButton } from "@/components/auth/submit-button";
import { PageHero } from "@/components/page-hero";
import { Panel } from "@/components/panel";
import { getAuthContext } from "@/lib/auth";
import { formatAdminDate, getAdminUserById } from "@/lib/admin";
import { TEAM_POSITIONS } from "@/lib/team-positions";

type AdminUserDetailPageProps = {
  params: Promise<{
    userId: string;
  }>;
  searchParams: Promise<{
    message?: string;
    error?: string;
  }>;
};

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: AdminUserDetailPageProps) {
  const [{ userId }, { message, error }, auth] = await Promise.all([
    params,
    searchParams,
    getAuthContext(),
  ]);
  const user = await getAdminUserById(userId);

  if (!user) {
    notFound();
  }

  const redirectTarget = `/admin/users/${user.id}`;
  const isCaptain = auth.profile?.role_level === 1;

  return (
    <>
      <PageHero
        eyebrow="ADMIN / USER DETAIL"
        title={user.displayName}
        description="这里集中放这一位成员的全部管理操作。修改完成后会停留在当前页面，适合逐个核对。"
      />

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/users"
          className="inline-flex items-center justify-center rounded-full border border-border bg-black/20 px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-white transition hover:border-accent/45 hover:text-accent"
        >
          返回成员列表
        </Link>
      </div>

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

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel className="p-6 sm:p-8">
          <p className="eyebrow">成员摘要</p>
          <div className="mt-5 space-y-4">
            <div>
              <p className="font-display text-3xl uppercase tracking-[0.12em] text-white">
                {user.displayName}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/[0.08] px-3 py-1 text-xs uppercase tracking-[0.22em] text-muted">
                  {user.roleLabel}
                </span>
                <span className="rounded-full border border-white/[0.08] px-3 py-1 text-xs uppercase tracking-[0.22em] text-muted">
                  {user.status}
                </span>
              </div>
            </div>

            <div className="rounded-[24px] border border-border bg-black/20 p-5 text-sm leading-7 text-muted">
              <p>邮箱：{user.email ?? "未绑定邮箱"}</p>
              <p>职位：{user.positionTitle}</p>
              <p>加入时间：{formatAdminDate(user.joinedAt)}</p>
              <p>资料可见性：{user.publicLabel}</p>
              <p>权限等级：Level {user.roleLevel}</p>
            </div>
          </div>
        </Panel>

        <Panel className="p-6 sm:p-8">
          <p className="eyebrow">编辑标签</p>
          <div className="mt-5 grid gap-5">
            <form
              action={adminUpdateUserDisplayNameOnDetail}
              className="grid gap-3"
            >
              <input type="hidden" name="user_id" value={user.id} />
              <input
                type="hidden"
                name="current_slug"
                value={user.username ?? user.id}
              />
              <input type="hidden" name="redirect_to" value={redirectTarget} />
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.22em] text-muted">
                  成员名字
                </span>
                <input
                  type="text"
                  name="display_name"
                  defaultValue={user.displayName}
                  minLength={1}
                  maxLength={40}
                  className="rounded-[20px] border border-border bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent/45"
                />
              </label>
              <SubmitButton
                label="更新名字"
                pendingLabel="提交中..."
                className="w-fit rounded-full border border-border bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-accent/45 hover:text-accent disabled:cursor-not-allowed disabled:opacity-70"
              />
            </form>

            <form
              action={adminUpdateUserJoinedAtOnDetail}
              className="grid gap-3"
            >
              <input type="hidden" name="user_id" value={user.id} />
              <input
                type="hidden"
                name="current_slug"
                value={user.username ?? user.id}
              />
              <input type="hidden" name="redirect_to" value={redirectTarget} />
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.22em] text-muted">
                  加入时间
                </span>
                <input
                  type="date"
                  name="joined_at"
                  defaultValue={user.joinedAt.slice(0, 10)}
                  className="rounded-[20px] border border-border bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-accent/45"
                />
              </label>
              <SubmitButton
                label="更新时间"
                pendingLabel="提交中..."
                className="w-fit rounded-full border border-border bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-accent/45 hover:text-accent disabled:cursor-not-allowed disabled:opacity-70"
              />
            </form>

            <form
              action={adminUpdateUserPositionOnDetail}
              className="grid gap-3"
            >
              <input type="hidden" name="user_id" value={user.id} />
              <input
                type="hidden"
                name="current_slug"
                value={user.username ?? user.id}
              />
              <input type="hidden" name="redirect_to" value={redirectTarget} />
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.22em] text-muted">
                  战队职位
                </span>
                <select
                  name="position_title"
                  defaultValue={user.positionTitle}
                  className="rounded-[20px] border border-border bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-accent/45"
                >
                  {TEAM_POSITIONS.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </label>
              <SubmitButton
                label="更新职位"
                pendingLabel="提交中..."
                className="w-fit rounded-full border border-border bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-accent/45 hover:text-accent disabled:cursor-not-allowed disabled:opacity-70"
              />
            </form>

            <form
              action={adminResetMemberPassword}
              className="grid gap-3"
            >
              <input type="hidden" name="user_id" value={user.id} />
              <input type="hidden" name="redirect_to" value={redirectTarget} />
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.22em] text-muted">
                  重置登录密码
                </span>
                <input
                  type="text"
                  name="password"
                  minLength={8}
                  maxLength={72}
                  placeholder="输入新密码（至少 8 位），设置后通过安全渠道告知成员"
                  className="rounded-[20px] border border-border bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent/45"
                  required
                />
              </label>
              <ConfirmSubmitButton
                label="重置密码"
                pendingLabel="提交中..."
                confirmMessage={`确定要重置「${user.displayName}」的登录密码吗？旧密码会立即失效。`}
                className="w-fit rounded-full border border-border bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-accent/45 hover:text-accent disabled:cursor-not-allowed disabled:opacity-70"
              />
            </form>

            <div className="grid gap-5 lg:grid-cols-2">
              <form
                action={adminUpdateUserStatusOnDetail}
                className="grid gap-3"
              >
                <input type="hidden" name="user_id" value={user.id} />
                <input
                  type="hidden"
                  name="redirect_to"
                  value={redirectTarget}
                />
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.22em] text-muted">
                    成员状态
                  </span>
                  <select
                    name="status"
                    defaultValue={user.status}
                    className="rounded-[20px] border border-border bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-accent/45"
                  >
                    <option value="active">active</option>
                    <option value="pending">pending</option>
                    <option value="disabled">disabled</option>
                  </select>
                </label>
                <ConfirmSubmitButton
                  label="更新状态"
                  pendingLabel="提交中..."
                  confirmMessage="确定要更新该成员的状态吗？disabled 将无法登录，pending 会失去正式成员权限。"
                  className="w-fit rounded-full border border-border bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-accent/45 hover:text-accent disabled:cursor-not-allowed disabled:opacity-70"
                />
              </form>

              <form action={adminUpdateUserRoleOnDetail} className="grid gap-3">
                <input type="hidden" name="user_id" value={user.id} />
                <input
                  type="hidden"
                  name="redirect_to"
                  value={redirectTarget}
                />
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.22em] text-muted">
                    权限等级
                  </span>
                  <select
                    name="role_level"
                    defaultValue={String(user.roleLevel)}
                    disabled={!isCaptain}
                    className="rounded-[20px] border border-border bg-black/25 px-4 py-3 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="1">Level 1</option>
                    <option value="2">Level 2</option>
                    <option value="3">Level 3</option>
                    <option value="4">Level 4</option>
                  </select>
                </label>
                {isCaptain ? (
                  <SubmitButton
                    label="更新权限"
                    pendingLabel="提交中..."
                    className="w-fit rounded-full border border-border bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-accent/45 hover:text-accent disabled:cursor-not-allowed disabled:opacity-70"
                  />
                ) : (
                  <p className="text-xs leading-6 text-muted">
                    当前账号不是队长，这里只读展示。
                  </p>
                )}
              </form>
            </div>
          </div>
        </Panel>
      </section>
    </>
  );
}
