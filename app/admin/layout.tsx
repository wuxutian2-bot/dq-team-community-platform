import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { Panel } from "@/components/panel";
import { AdminNavigation } from "@/components/admin-navigation";
import { buildRedirectPath, getAuthContext, getRoleLabel } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isConfigured, user, profile } = await getAuthContext();

  if (!isConfigured) {
    return (
      <div className="page-shell">
        <PageHero
          eyebrow="ADMIN AUTH"
          title="后台暂未启用"
          description="管理服务暂未启用，请联系站点维护人员完成配置。"
        />
        <Panel className="p-6 sm:p-8">
          <p className="text-sm leading-7 text-muted">
            请先在 .env.local 中配置 NEXT_PUBLIC_SUPABASE_URL、
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 和
            SUPABASE_SERVICE_ROLE_KEY。
          </p>
        </Panel>
      </div>
    );
  }

  if (!user) {
    redirect(
      buildRedirectPath("/login", {
        next: "/admin",
        error: "请先登录后再进入后台。",
      }),
    );
  }

  if (!profile || profile.status !== "active" || profile.role_level > 2) {
    return (
      <div className="page-shell">
        <PageHero
          eyebrow="ACCESS DENIED"
          title="后台访问受限"
          description="当前账号已登录，但不具备后台访问权限。只有队长和副队可以进入后台管理系统。"
        />
        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Panel className="p-6 sm:p-8">
            <p className="eyebrow">当前身份</p>
            <p className="mt-5 text-lg text-white">
              {profile?.display_name ?? user.email ?? "未知成员"}
            </p>
            <p className="mt-2 text-sm text-muted">
              {getRoleLabel(profile?.role_level)} /{" "}
              {profile?.status ?? "未建档"}
            </p>
          </Panel>
          <Panel className="p-6 sm:p-8">
            <p className="eyebrow">返回入口</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/profile"
                className="rounded-full border border-border bg-black/25 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white hover:border-accent/40 hover:text-accent"
              >
                返回个人中心
              </Link>
              <Link
                href="/"
                className="rounded-full border border-accent/25 bg-accent px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#081109] hover:-translate-y-0.5 hover:bg-accent-strong"
              >
                返回首页
              </Link>
            </div>
          </Panel>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-title">DQ 管理工作台</div>
        <AdminNavigation />
        <div className="admin-sidebar-identity">
          <span>{profile.display_name}</span>
          <p>{getRoleLabel(profile.role_level)}</p>
        </div>
      </aside>
      <div className="admin-workspace">{children}</div>
    </div>
  );
}
