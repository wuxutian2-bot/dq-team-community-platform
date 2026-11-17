import Link from "next/link";
import {
  adminCreateMemberAccount,
  adminImportMembersFromWorkbook,
} from "@/app/admin/actions";
import { AdminPagination } from "@/components/admin-pagination";
import { ConfirmSubmitButton } from "@/components/auth/confirm-submit-button";
import { SubmitButton } from "@/components/auth/submit-button";
import { PageHero } from "@/components/page-hero";
import { Panel } from "@/components/panel";
import { formatAdminDate, getAdminUsers } from "@/lib/admin";
import { TEAM_POSITIONS } from "@/lib/team-positions";

const WORKBOOK_FILE_NAME = "殿祁（🐮🐴小窝）_$ǿ_20260427_215142.xlsx";

type AdminUsersPageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
    page?: string;
  }>;
};

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const { message, error, page } = await searchParams;
  const usersPage = await getAdminUsers(page);
  const users = usersPage.items;

  return (
    <>
      <PageHero
        eyebrow="ADMIN / USERS"
        title="成员管理"
        description="列表页现在只保留成员摘要。点右侧“编辑标签”后，再进入独立页面修改名字、加入时间、职位、状态和权限。"
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

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel className="p-6 sm:p-8">
          <p className="eyebrow">单个创建</p>
          <p className="mt-4 text-sm leading-7 text-muted">
            新成员默认创建为 active、Level
            3，并立即完成激活。战队职位只是展示字段，不直接决定权限。
          </p>

          <form action={adminCreateMemberAccount} className="mt-6 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                邮箱
              </span>
              <input
                type="email"
                name="email"
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base text-white outline-none placeholder:text-muted focus:border-accent/45"
                placeholder="member@qq.com"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                初始密码
              </span>
              <input
                type="text"
                name="password"
                minLength={8}
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base text-white outline-none placeholder:text-muted focus:border-accent/45"
                placeholder="至少 8 位"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                显示名称
              </span>
              <input
                type="text"
                name="display_name"
                maxLength={40}
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base text-white outline-none placeholder:text-muted focus:border-accent/45"
                placeholder="例如：慕夏 / Zero / Echo"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                加入时间
              </span>
              <input
                type="date"
                name="joined_at"
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base text-white outline-none focus:border-accent/45"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm uppercase tracking-[0.22em] text-muted">
                战队职位
              </span>
              <select
                name="position_title"
                defaultValue="成员"
                className="rounded-[22px] border border-border bg-black/25 px-5 py-4 text-base text-white outline-none focus:border-accent/45"
              >
                {TEAM_POSITIONS.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </label>

            <SubmitButton
              label="创建成员账号"
              pendingLabel="创建中..."
              className="w-fit rounded-full border border-accent/25 bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#081109] hover:-translate-y-0.5 hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
            />
          </form>
        </Panel>

        <Panel className="p-6 sm:p-8">
          <p className="eyebrow">Excel 批量导入</p>
          <p className="mt-4 text-sm leading-7 text-muted">
            这个入口会按主文件夹中的 {WORKBOOK_FILE_NAME}{" "}
            从上到下逐行创建成员账号。
          </p>

          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-border bg-black/20 px-4 py-4 text-sm leading-7 text-muted">
              邮箱：读取 QQ号 列，拼成 QQ号@qq.com。
            </div>
            <div className="rounded-2xl border border-border bg-black/20 px-4 py-4 text-sm leading-7 text-muted">
              初始密码：系统为每个账号随机生成强密码。导入完成后，请在成员编辑页用“重置密码”设置初始密码，再通过安全渠道分发给成员。
            </div>
            <div className="rounded-2xl border border-border bg-black/20 px-4 py-4 text-sm leading-7 text-muted">
              显示名称：优先用 群昵称，没有群昵称就退回
              QQ昵称；如果两列都没有，则该行跳过。超过 40 字符的昵称会被截断。
            </div>
            <div className="rounded-2xl border border-border bg-black/20 px-4 py-4 text-sm leading-7 text-muted">
              加入时间：读取表格最后一列 加入时间，并写入成员资料。
            </div>
          </div>

          <form action={adminImportMembersFromWorkbook} className="mt-6">
            <ConfirmSubmitButton
              label="从主文件夹 Excel 批量导入"
              pendingLabel="批量导入中..."
              confirmMessage="确定要从 Excel 批量创建成员账号吗？这会生成真实登录账号，导入后需逐个重置初始密码再分发给成员。"
              className="w-fit rounded-full border border-accent/25 bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#081109] hover:-translate-y-0.5 hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
            />
          </form>

          <div className="mt-8 rounded-[28px] border border-border bg-black/20 p-5">
            <p className="eyebrow">说明</p>
            <div className="mt-4 grid gap-3 text-sm leading-7 text-muted">
              <p>列表页只展示摘要，避免成员过多时页面过长。</p>
              <p>点击成员右侧的“编辑标签”后，会进入该成员的独立编辑页。</p>
              <p>
                独立编辑页里会集中放名字、加入时间、职位、状态和权限的修改入口。
              </p>
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4">
        {users.map((user) => (
          <Panel key={user.id} className="p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-display text-2xl uppercase tracking-[0.12em] text-white">
                    {user.displayName}
                  </p>
                  <span className="rounded-full border border-white/[0.08] px-3 py-1 text-xs uppercase tracking-[0.22em] text-muted">
                    {user.roleLabel}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-7 text-muted">
                  {user.email ?? "未绑定邮箱"} / {user.positionTitle}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted">
                  加入时间 {formatAdminDate(user.joinedAt)} / {user.publicLabel}
                </p>
              </div>

              <Link
                href={`/admin/users/${user.id}`}
                className="inline-flex w-fit items-center justify-center rounded-full border border-accent/25 bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-[#081109] transition hover:-translate-y-0.5 hover:bg-accent-strong"
              >
                编辑标签
              </Link>
            </div>
          </Panel>
        ))}
        {usersPage.total === 0 ? (
          <Panel className="p-6">
            <p className="text-sm leading-7 text-muted">暂无成员数据。</p>
          </Panel>
        ) : null}
      </section>

      <AdminPagination
        basePath="/admin/users"
        page={usersPage.page}
        totalPages={usersPage.totalPages}
        total={usersPage.total}
      />
    </>
  );
}
