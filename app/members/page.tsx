export const metadata = { title: "成员展示" };

import Image from "next/image";
import Link from "next/link";
import { MemberDirectory } from "@/components/member-directory";
import { RetryButton } from "@/components/retry-button";
import { UiIcon } from "@/components/ui-icon";
import {
  formatJoinDate,
  getPublicMembers,
  type MemberDirectoryRole,
} from "@/lib/members";
import "./roster.css";

type MembersPageProps = {
  searchParams: Promise<{
    q?: string;
    role?: string;
    page?: string;
  }>;
};

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const params = await searchParams;
  const role: MemberDirectoryRole =
    params.role === "leaders" || params.role === "members"
      ? params.role
      : "all";
  const query = (params.q ?? "").trim();
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const directory = await getPublicMembers({ page, query, role });
  return (
    <div className="page-shell roster-page">
      <section className="roster-hero" aria-labelledby="roster-title">
        <div className="roster-hero-scene" aria-hidden="true">
          <Image
            src="/images/roster/manga-city-v1.webp"
            alt=""
            fill
            sizes="(max-width:720px) 100vw, 650px"
            loading="eager"
            className="roster-hero-image"
          />
        </div>
        <nav className="ui-breadcrumb" aria-label="当前位置">
          <Link href="/">DQ 战队</Link>
          <UiIcon name="chevron" size={12} />
          <span>成员展示</span>
        </nav>
        <div className="roster-hero-content">
          <h1 id="roster-title" className="roster-title">
            <span className="sr-only">成员展示</span>
            <Image
              src="/images/roster/manga-title-v1.webp"
              alt=""
              width={1600}
              height={533}
              sizes="(max-width:720px) 90vw, 520px"
              priority
              className="roster-title-image"
            />
          </h1>
          <p>
            每一场并肩作战，都从认识彼此开始。
            <br className="roster-desktop-break" />
            找到熟悉的昵称，也认识下一位队友。
          </p>
        </div>
      </section>
      {directory.status === "error" ? (
        <div className="ui-empty" role="alert">
          <div className="ui-empty-symbol">
            <UiIcon name="shield" size={30} />
          </div>
          <h2>成员目录暂时加载失败</h2>
          <p>
            成员服务暂时没有响应，不是没有成员。可以再试一次；如果多次失败，请联系战队管理员。
          </p>
          <div className="ui-actions">
            <RetryButton />
          </div>
        </div>
      ) : (
        <MemberDirectory
          members={directory.members.map((member) => ({
            ...member,
            joinedLabel: formatJoinDate(member.joinedAt),
          }))}
          total={directory.total}
          page={directory.page}
          pageCount={directory.pageCount}
          role={role}
          query={query}
        />
      )}
    </div>
  );
}
