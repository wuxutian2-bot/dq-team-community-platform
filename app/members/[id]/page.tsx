import { MemberAvatar } from "@/components/member-avatar";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { UiIcon } from "@/components/ui-icon";
import { formatJoinDate, getPublicMemberByIdentifier } from "@/lib/members";

type MemberDetailPageProps = { params: Promise<{ id: string }> };
export default async function MemberDetailPage({
  params,
}: MemberDetailPageProps) {
  const { id } = await params;
  const member = await getPublicMemberByIdentifier(id);
  if (!member) notFound();
  return (
    <div className="page-shell">
      <PageHero
        title={member.displayName}
        description={`${member.roleTitle} · DQ 战队成员`}
        actions={[
          { href: "/members", label: "返回成员名册", variant: "secondary" },
        ]}
      />
      <section className="member-detail-grid" aria-label="成员公开资料">
        <aside className="member-identity">
          <MemberAvatar
            src={member.avatarUrl}
            initials={member.initials}
            size={88}
          />
          <h2>{member.displayName}</h2>
          <p>{member.roleTitle}</p>
          <div style={{ marginTop: 18 }}>
            <span className="ui-pill">{member.visibilityLabel}</span>
          </div>
          <div className="ui-actions">
            <Link href="/members" className="ui-text-link">
              认识更多队友
              <UiIcon name="arrow" size={16} />
            </Link>
          </div>
        </aside>
        <div className="member-details">
          <h2>关于我</h2>
          <p>{member.bio || "这位队友还没有填写个人简介。"}</p>
          <dl className="ui-detail-list">
            {[
              { label: "战队职位", value: member.roleTitle },
              { label: "加入时间", value: formatJoinDate(member.joinedAt) },
              { label: "常用游戏", value: member.favoriteGame || "待成员补充" },
              { label: "资料可见范围", value: member.visibilityLabel },
            ].map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
          <p style={{ marginTop: 30, fontSize: 12, color: "#a3b9a9" }}>
            成员名片由本人维护，仅展示已公开的资料。
          </p>
        </div>
      </section>
    </div>
  );
}
