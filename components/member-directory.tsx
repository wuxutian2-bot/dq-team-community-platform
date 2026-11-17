"use client";

import Image from "next/image";
import { MemberAvatar } from "@/components/member-avatar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { MemberDirectoryRole, MemberViewModel } from "@/lib/members";
import { EmptyState } from "@/components/empty-state";
import { UiIcon } from "@/components/ui-icon";

export function MemberDirectory({
  members,
  total,
  page,
  pageCount,
  role,
  query,
}: {
  members: (MemberViewModel & { joinedLabel: string })[];
  total: number;
  page: number;
  pageCount: number;
  role: MemberDirectoryRole;
  query: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchInput, setSearchInput] = useState(query);
  const [syncedQuery, setSyncedQuery] = useState(query);

  if (syncedQuery !== query) {
    setSyncedQuery(query);
    setSearchInput(query);
  }

  const navigate = useCallback(
    (next: { role?: MemberDirectoryRole; q?: string; page?: number }) => {
      const nextRole = next.role ?? role;
      const nextQuery = (next.q ?? query).trim();
      const nextPage = next.page ?? 1;
      const params = new URLSearchParams();

      if (nextRole !== "all") {
        params.set("role", nextRole);
      }
      if (nextQuery) {
        params.set("q", nextQuery);
      }
      if (nextPage > 1) {
        params.set("page", String(nextPage));
      }

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, query, role, router],
  );

  useEffect(() => {
    if (searchInput.trim() === query) {
      return;
    }
    const timer = window.setTimeout(() => {
      navigate({ q: searchInput });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [navigate, query, searchInput]);

  function clear() {
    setSearchInput("");
    navigate({ role: "all", q: "" });
  }

  if (!total)
    return (
      <EmptyState
        icon="users"
        title="暂无公开成员资料"
        description="成员完善资料并开启公开展示后，将出现在这里。已经是 DQ 成员？可以到个人中心维护自己的名片。"
        action={{ href: "/profile", label: "维护我的资料" }}
        secondary={{ href: "/#recruitment", label: "申请加入战队" }}
      />
    );

  return (
    <section aria-label="成员名册">
      <div className="ui-filter-bar">
        <div className="ui-tabs" aria-label="按成员角色筛选">
          {[
            { value: "all", label: "全部成员" },
            { value: "leaders", label: "队长与副队" },
            { value: "members", label: "正式成员" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={role === item.value}
              onClick={() =>
                navigate({ role: item.value as MemberDirectoryRole })
              }
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="ui-search">
          <span className="sr-only">搜索成员</span>
          <UiIcon name="search" size={18} />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="搜索昵称、职位或常用游戏"
          />
        </label>
      </div>
      <div className="ui-results-note">
        <p role="status">
          展示 {members.length} / {total} 位成员
        </p>
        <div className="directory-result-actions">
          {query || role !== "all" ? (
            <button type="button" className="ui-clear" onClick={clear}>
              清除筛选
            </button>
          ) : null}
          <Link href="/profile" className="ui-text-link">
            维护我的名片
            <UiIcon name="outward" size={15} />
          </Link>
        </div>
      </div>
      {members.length ? (
        <div className="member-grid">
          {members.map((member, index) => {
            const background =
              (member.id.charCodeAt(0) || 0) % 2 === 0 ? "city" : "arcade";
            return (
              <article
                className="member-card manga-member-card"
                key={member.id}
              >
                <div className="manga-card-art" aria-hidden="true">
                  <Image
                    src={`/images/roster/manga-${background}-v1.webp`}
                    loading={index < 4 ? "eager" : "lazy"}
                    alt=""
                    fill
                    sizes="(max-width:600px) 45vw, (max-width:1000px) 30vw, 310px"
                  />
                </div>
                <div className="manga-card-content">
                  <div className="manga-card-top">
                    <span className="manga-card-role">{member.roleTitle}</span>
                    <span className="manga-card-mark" aria-hidden="true">
                      DQ
                    </span>
                  </div>
                  <div className="member-card-header">
                    <MemberAvatar
                      src={member.avatarUrl}
                      initials={member.initials}
                    />
                    <div className="manga-card-identity">
                      <h2 title={member.displayName}>{member.displayName}</h2>
                      <p className="member-card-role">
                        {member.visibilityLabel}
                      </p>
                    </div>
                  </div>
                  <p
                    className="member-card-bio"
                    title={member.bio || member.favoriteGame || undefined}
                  >
                    {member.bio || member.favoriteGame || "个人简介待补充"}
                  </p>
                  <div className="manga-card-meta">
                    <span>加入战队</span>
                    <time dateTime={member.joinedAt}>{member.joinedLabel}</time>
                  </div>
                  <div className="member-card-footer">
                    <span>查看名片</span>
                    <UiIcon name="outward" size={17} />
                  </div>
                </div>
                <Link
                  className="manga-card-link"
                  href={`/members/${member.slug}`}
                  aria-label={`查看${member.displayName}的成员资料`}
                />
              </article>
            );
          })}
        </div>
      ) : (
        <div className="ui-empty">
          <div className="ui-empty-symbol">
            <UiIcon name="search" size={30} />
          </div>
          <h2>没有找到匹配的队友</h2>
          <p>试试其他昵称、职位或游戏名称，也可以清除筛选查看所有成员。</p>
          <div className="ui-actions">
            <button type="button" className="ui-button" onClick={clear}>
              查看全部成员
            </button>
          </div>
        </div>
      )}
      {pageCount > 1 ? (
        <nav
          className="ui-actions"
          aria-label="成员分页"
          style={{ justifyContent: "center", marginTop: 30 }}
        >
          <button
            type="button"
            className="ui-button"
            disabled={page <= 1}
            onClick={() => navigate({ page: page - 1 })}
          >
            上一页
          </button>
          <span role="status">第 {page} / {pageCount} 页</span>
          <button
            type="button"
            className="ui-button"
            disabled={page >= pageCount}
            onClick={() => navigate({ page: page + 1 })}
          >
            下一页
            <UiIcon name="users" size={17} />
          </button>
        </nav>
      ) : null}
    </section>
  );
}
