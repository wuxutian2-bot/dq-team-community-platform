import Image from "next/image";
import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { getAuthContext, getRoleLabel } from "@/lib/auth";
import { SiteHeaderNav } from "@/components/site-header-nav";

export async function SiteHeader() {
  const { user, profile } = await getAuthContext();
  const canAccessAdmin = (profile?.role_level ?? 4) <= 2;
  const memberName = profile?.display_name ?? user?.email?.split("@")[0] ?? "DQ Member";

  return (
    <header className="site-header">
      <a href="#main-content" className="skip-link">跳转到主要内容</a>
      <div className="site-header-inner">
        <div className="site-brand-row">
          <Link href="/" className="site-brand" aria-label="DQ 殿祁战队首页">
            <Image src="/images/team-logo.jpg" alt="" width={42} height={42} priority className="site-brand-logo" />
            <div><p className="site-brand-name">DQ<span>殿祁战队</span></p><p className="site-brand-description">成长记录 · 成员社区</p></div>
          </Link>
          {user ? (
            <div className="site-account">
              <Link href="/profile" title={getRoleLabel(profile?.role_level)}>{memberName}</Link>
              <form action={logout}><button type="submit">退出登录</button></form>
            </div>
          ) : <span className="site-visitor">欢迎来到 DQ</span>}
        </div>
        <SiteHeaderNav
          isAuthenticated={Boolean(user)}
          canAccessAdmin={canAccessAdmin}
          accountActions={user ? <form action={logout} className="site-mobile-logout"><button type="submit">退出登录</button></form> : null}
        />
      </div>
    </header>
  );
}
