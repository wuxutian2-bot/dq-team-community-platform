import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { Panel } from "@/components/panel";
import { UiIcon } from "@/components/ui-icon";
import { hasSupabasePublicEnv } from "@/lib/env";

export default function AdminSettingsPage() {
  const configured = hasSupabasePublicEnv();
  return (
    <>
      <PageHero
        title="网站设置"
        description="站点运行信息与维护入口。本页为只读总览，内容设置请前往对应模块。"
      />
      <section className="grid gap-6 md:grid-cols-2">
        <Panel className="p-6">
          <h2 className="text-xl font-semibold">成员服务配置</h2>
          <span className="ui-pill mt-4">
            {configured ? "已填写连接配置" : "尚未配置"}
          </span>
          <p className="mt-4 text-sm leading-7 text-muted">
            此状态仅表示服务连接参数是否齐全。成员账号、状态与权限可在成员管理中维护。
          </p>
          <Link className="ui-text-link mt-4" href="/admin/users">
            进入成员管理
            <UiIcon name="arrow" size={16} />
          </Link>
        </Panel>
        <Panel className="p-6">
          <h2 className="text-xl font-semibold">站点通知</h2>
          <p className="mt-4 text-sm leading-7 text-muted">
            创建或调整公告，设置受众、置顶与生效时间。发布前确认通知内容和展示范围。
          </p>
          <Link className="ui-text-link mt-4" href="/admin/announcements">
            管理公告
            <UiIcon name="arrow" size={16} />
          </Link>
        </Panel>
        <Panel className="p-6">
          <h2 className="text-xl font-semibold">图片与公开档案</h2>
          <p className="mt-4 text-sm leading-7 text-muted">
            成员头像、帖子封面和荣誉图片随各自内容维护。确认图片清晰、来源合适，再公开展示。
          </p>
          <div className="ui-actions">
            <Link className="ui-text-link" href="/admin/achievements">
              维护荣誉墙
              <UiIcon name="outward" size={16} />
            </Link>
            <Link className="ui-text-link" href="/admin/history">
              维护成长史
              <UiIcon name="outward" size={16} />
            </Link>
          </div>
        </Panel>
        <Panel className="p-6">
          <h2 className="text-xl font-semibold">访问与发布</h2>
          <p className="mt-4 text-sm leading-7 text-muted">
            后台仅面向已激活的队长与副队账号。内容是否公开，由对应条目的状态与阅读范围决定。
          </p>
          <Link className="ui-text-link mt-4" href="/">
            查看公开网站
            <UiIcon name="outward" size={16} />
          </Link>
        </Panel>
      </section>
    </>
  );
}
