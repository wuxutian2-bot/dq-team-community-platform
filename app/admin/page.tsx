import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { Panel } from "@/components/panel";
import {
  getAdminAnnouncements,
  getAdminComments,
  getAdminDashboardData,
  getAdminPosts,
  getAdminUsers,
} from "@/lib/admin";

export default async function AdminDashboardPage() {
  const [metrics, usersPage, postsPage, commentsPage, announcements] =
    await Promise.all([
      getAdminDashboardData(),
      getAdminUsers("1", 4),
      getAdminPosts("1", 1),
      getAdminComments("1", 1),
      getAdminAnnouncements(),
    ]);
  const users = usersPage.items;
  const posts = postsPage.items;
  const comments = commentsPage.items;

  return (
    <>
      <PageHero
        eyebrow="CONTROL ROOM"
        title="后台首页"
        description="查看成员状态、社区内容与站点公告，快速进入需要处理的模块。"
      />

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "待激活成员",
            value: metrics.pendingUsers,
            href: "/admin/users",
          },
          {
            label: "已发布帖子",
            value: metrics.publishedPosts,
            href: "/admin/posts",
          },
          {
            label: "隐藏评论",
            value: metrics.hiddenComments,
            href: "/admin/comments",
          },
          {
            label: "在线公告",
            value: metrics.activeAnnouncements,
            href: "/admin/announcements",
          },
        ].map((metric) => (
          <Link key={metric.label} href={metric.href}>
            <Panel className="admin-grid p-6 transition hover:border-accent/25 hover:bg-accent/[0.05]">
              <p className="text-sm uppercase tracking-[0.28em] text-muted">
                {metric.label}
              </p>
              <p className="mt-4 font-display text-5xl uppercase tracking-[0.16em] text-accent">
                {String(metric.value).padStart(2, "0")}
              </p>
            </Panel>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Panel className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">近期成员</p>
              <p className="mt-3 text-sm leading-7 text-muted">
                这里展示当前后台能看到的最新成员状态，方便快速发现待激活或异常账号。
              </p>
            </div>
            <Link
              href="/admin/users"
              className="rounded-full border border-border bg-black/20 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white hover:border-accent/45 hover:text-accent"
            >
              进入成员管理
            </Link>
          </div>

          <div className="mt-6 grid gap-4">
            {users.slice(0, 4).map((user) => (
              <div
                key={user.id}
                className="rounded-[24px] border border-border bg-black/20 px-5 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white">
                      {user.displayName}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted">
                      {user.roleLabel} / {user.status}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/[0.08] px-3 py-1 text-xs uppercase tracking-[0.22em] text-muted">
                    {user.publicLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-6">
          <Panel className="p-6">
            <p className="eyebrow">内容脉冲</p>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-border bg-black/20 px-4 py-4 text-sm leading-7 text-muted">
                最近帖子：{posts[0]?.title ?? "暂无帖子数据"}
              </div>
              <div className="rounded-2xl border border-border bg-black/20 px-4 py-4 text-sm leading-7 text-muted">
                最近评论：{comments[0]?.content.slice(0, 48) ?? "暂无评论数据"}
              </div>
              <div className="rounded-2xl border border-border bg-black/20 px-4 py-4 text-sm leading-7 text-muted">
                最近公告：{announcements[0]?.title ?? "暂无公告数据"}
              </div>
            </div>
          </Panel>

          <Panel className="p-6">
            <p className="eyebrow">管理提示</p>
            <p className="mt-5 text-sm leading-7 text-muted">
              成员、内容和档案分别在对应模块中维护。公开发布前，请检查信息准确性与展示范围。
            </p>
          </Panel>
        </div>
      </section>
    </>
  );
}
