export const metadata = { title: "成员登录" };

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { login } from "@/app/auth/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { PageHero } from "@/components/page-hero";
import { PasswordInput } from "@/components/password-input";
import { UiIcon } from "@/components/ui-icon";
import { getAuthContext, sanitizeNextPath } from "@/lib/auth";
import { hasSupabasePublicEnv } from "@/lib/env";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
};
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = sanitizeNextPath(params.next);
  const auth = await getAuthContext();
  if (auth.user && auth.profile?.status === "active") redirect(nextPath);
  return (
    <div className="page-shell">
      <PageHero
        title="成员登录"
        description="回到熟悉的队伍，继续我们的故事。"
      />
      <section className="login-shell">
        <div className="login-story">
          <Image
            src="/images/recruitment-room-concept.webp"
            alt=""
            fill
            sizes="(max-width:850px) 100vw, 650px"
            className="login-story-image"
          />
          <span className="login-story-mark">DQ</span>
          <div>
            <h2>欢迎归队。</h2>
            <p>维护你的成员名片，分享实战心得，和队友一起把热爱延续下去。</p>
          </div>
          <span
            className="dq-about-concept-caption"
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              fontSize: 10,
              color: "#b9c9bd",
            }}
          >
            AI 生成 · 训练室概念氛围图
          </span>
        </div>
        <div className="login-form-panel">
          <h2>进入成员社区</h2>
          <p>使用管理员为你开通的成员账号登录。</p>
          {params.error ? (
            <div role="alert" className="ui-notice ui-notice--error">
              {params.error}
            </div>
          ) : null}
          {params.message ? (
            <div role="status" className="ui-notice">
              {params.message}
            </div>
          ) : null}
          {!hasSupabasePublicEnv() ? (
            <div className="ui-notice ui-notice--warning">
              登录服务暂未启用，请联系战队管理员。
            </div>
          ) : (
            <form action={login}>
              <input type="hidden" name="next" value={nextPath} />
              <label>
                <span>成员邮箱</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="请输入成员邮箱"
                  required
                />
              </label>
              <div>
                <label htmlFor="member-password">
                  <span>登录密码</span>
                </label>
                <div style={{ marginTop: 9 }}>
                  <PasswordInput />
                </div>
              </div>
              <SubmitButton
                label="登录并进入社区"
                pendingLabel="正在登录…"
                className="ui-button ui-button--primary"
              />
            </form>
          )}
          <div className="login-form-footnote">
            <UiIcon name="shield" size={17} />
            <p>
              成员账号由队长或副队创建，不开放自行注册。账号未激活或已停用时，请联系管理员处理。
            </p>
          </div>
          {nextPath !== "/profile" ? (
            <p style={{ marginTop: 18, fontSize: 12, color: "#b6ccb9" }}>
              登录成功后会回到刚才访问的页面。
            </p>
          ) : null}
        </div>
      </section>
      <div className="login-help">
        <p>还没有成员账号？先来了解 DQ。</p>
        <Link className="ui-text-link" href="/#recruitment">
          前往战队审核群
          <UiIcon name="outward" size={17} />
        </Link>
      </div>
    </div>
  );
}
