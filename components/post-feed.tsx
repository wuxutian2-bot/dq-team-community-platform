"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import type {
  PostFeedEntry,
  PostsFeedScope,
  PostsFeedSort,
} from "@/lib/posts";
import { MemberAvatar } from "@/components/member-avatar";
import { UiIcon } from "@/components/ui-icon";

export type PostFeedItem = PostFeedEntry & {
  dateLabel: string;
};

const SORT_LABELS: Record<PostsFeedSort, string> = {
  latest: "最新发布",
  likes: "最多点赞",
  comments: "最多讨论",
};

export function PostFeed({
  posts,
  isAuthenticated,
  total,
  page,
  pageCount,
  scope,
  sort,
  query,
  scopeCounts,
}: {
  posts: PostFeedItem[];
  isAuthenticated: boolean;
  total: number;
  page: number;
  pageCount: number;
  scope: PostsFeedScope;
  sort: PostsFeedSort;
  query: string;
  scopeCounts: Record<PostsFeedScope, number>;
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
    (next: {
      scope?: PostsFeedScope;
      sort?: PostsFeedSort;
      q?: string;
      page?: number;
    }) => {
      const nextScope = next.scope ?? scope;
      const nextSort = next.sort ?? sort;
      const nextQuery = (next.q ?? query).trim();
      const nextPage = next.page ?? 1;
      const params = new URLSearchParams();

      if (nextScope !== "all") {
        params.set("scope", nextScope);
      }
      if (nextSort !== "latest") {
        params.set("sort", nextSort);
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
    [pathname, query, router, scope, sort],
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

  const scopes = [
    { value: "all" as const, label: "全部帖子", count: scopeCounts.all },
    {
      value: "public" as const,
      label: "公开讨论",
      count: scopeCounts.public,
    },
    ...(isAuthenticated
      ? [
          {
            value: "members" as const,
            label: "成员交流",
            count: scopeCounts.members,
          },
        ]
      : []),
  ];

  const isFiltered = scope !== "all" || Boolean(query) || sort !== "latest";
  const featureFirst = !isFiltered && page === 1 && posts.length > 0;

  function resetFilters() {
    setSearchInput("");
    navigate({ scope: "all", sort: "latest", q: "" });
  }

  return (
    <div className="comms-feed">
      <div className="comms-toolbar">
        <div className="comms-scopes" aria-label="按帖子可见范围筛选">
          {scopes.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={scope === item.value}
              onClick={() => navigate({ scope: item.value })}
            >
              {item.label}
              <span className="comms-scope-count">{item.count}</span>
            </button>
          ))}
        </div>
        <div className="comms-tools">
          <label className="comms-search">
            <span className="sr-only">搜索帖子</span>
            <UiIcon name="search" size={17} />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="搜索标题、摘要或作者"
            />
          </label>
          <label className="comms-sort">
            <span className="sr-only">排序方式</span>
            <select
              value={sort}
              onChange={(event) =>
                navigate({ sort: event.target.value as PostsFeedSort })
              }
            >
              {(Object.keys(SORT_LABELS) as PostsFeedSort[]).map((mode) => (
                <option key={mode} value={mode}>
                  {SORT_LABELS[mode]}
                </option>
              ))}
            </select>
            <UiIcon name="chevron" size={14} />
          </label>
        </div>
      </div>

      <div className="comms-result">
        <p role="status">
          {total} 篇帖子
          {isFiltered ? ` · ${SORT_LABELS[sort]}` : ""}
        </p>
        {isFiltered ? (
          <button type="button" className="comms-clear" onClick={resetFilters}>
            清除筛选
          </button>
        ) : null}
      </div>

      {posts.length ? (
        <div className="comms-cards">
          {posts.map((post, index) => {
            const featured = featureFirst && index === 0;
            return (
              <article
                key={post.id}
                className={`comms-card${featured ? " comms-card--featured" : ""}${
                  post.coverImageUrl && !featured ? " comms-card--cover" : ""
                }`}
                style={{ "--i": Math.min(index, 8) } as CSSProperties}
              >
                {featured && post.coverImageUrl ? (
                  <Link
                    href={`/posts/${post.id}`}
                    className="comms-card-banner"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <Image
                      src={post.coverImageUrl}
                      alt=""
                      width={1200}
                      height={520}
                      sizes="(max-width: 850px) 100vw, 860px"
                    />
                  </Link>
                ) : null}
                <div className="comms-card-body">
                  <div className="comms-card-main">
                    <header className="comms-card-head">
                      <span className="comms-avatar">
                        <MemberAvatar
                          src={post.authorAvatarUrl}
                          initials={post.authorName.slice(0, 1)}
                          size={40}
                        />
                      </span>
                      <div className="comms-byline">
                        <span className="comms-author">{post.authorName}</span>
                        <span className="comms-byline-sub">
                          {post.authorRole}
                          <span aria-hidden="true"> · </span>
                          <time dateTime={post.createdAt}>{post.dateLabel}</time>
                        </span>
                      </div>
                      <div className="comms-tags">
                        {featured ? (
                          <span className="comms-tag comms-tag--latest">
                            <UiIcon name="zap" size={12} />
                            最新
                          </span>
                        ) : null}
                        <span
                          className={`comms-tag ${
                            post.visibility === "members"
                              ? "comms-tag--members"
                              : "comms-tag--public"
                          }`}
                        >
                          {post.visibilityLabel}
                        </span>
                        {post.status !== "published" ? (
                          <span className="comms-tag comms-tag--status">
                            {post.statusLabel}
                          </span>
                        ) : null}
                      </div>
                    </header>
                    <h2 className="comms-card-title">
                      <Link href={`/posts/${post.id}`}>{post.title}</Link>
                    </h2>
                    <p className="comms-card-excerpt">
                      {post.excerpt || post.content.slice(0, 140)}
                    </p>
                    <footer className="comms-card-foot">
                      <div className="comms-metrics">
                        <span>
                          <UiIcon name="clock" size={14} />约{" "}
                          {post.readingMinutes} 分钟
                        </span>
                        <span aria-label={`${post.likesCount} 个点赞`}>
                          <UiIcon name="heart" size={14} />
                          <b>{post.likesCount}</b>
                        </span>
                        <span aria-label={`${post.commentsCount} 条评论`}>
                          <UiIcon name="message" size={14} />
                          <b>{post.commentsCount}</b>
                        </span>
                        {!post.commentsEnabled ? (
                          <span className="comms-muted-note">评论已关闭</span>
                        ) : null}
                      </div>
                      <Link
                        href={`/posts/${post.id}`}
                        className="comms-card-cta"
                        aria-label={`阅读${post.title}`}
                      >
                        阅读讨论
                        <UiIcon name="arrow" size={16} />
                      </Link>
                    </footer>
                  </div>
                  {post.coverImageUrl && !featured ? (
                    <Link
                      href={`/posts/${post.id}`}
                      className="comms-card-cover"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <Image
                        src={post.coverImageUrl}
                        alt=""
                        width={400}
                        height={300}
                        sizes="200px"
                      />
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="ui-empty comms-empty">
          <div className="ui-empty-symbol">
            <UiIcon name="search" size={30} />
          </div>
          <h2>没有找到相关帖子</h2>
          <p>换个关键词，或查看全部讨论。</p>
          <div className="ui-actions">
            <button type="button" className="ui-button" onClick={resetFilters}>
              查看全部帖子
            </button>
          </div>
        </div>
      )}

      {pageCount > 1 ? (
        <nav
          className="ui-actions"
          aria-label="帖子分页"
          style={{ justifyContent: "center", marginTop: 24 }}
        >
          <button
            type="button"
            className="ui-button"
            disabled={page <= 1}
            onClick={() => navigate({ page: page - 1 })}
          >
            上一页
          </button>
          <span className="comms-muted-note" role="status">
            第 {page} / {pageCount} 页
          </span>
          <button
            type="button"
            className="ui-button"
            disabled={page >= pageCount}
            onClick={() => navigate({ page: page + 1 })}
          >
            下一页
            <UiIcon name="arrow" size={16} />
          </button>
        </nav>
      ) : null}
    </div>
  );
}
