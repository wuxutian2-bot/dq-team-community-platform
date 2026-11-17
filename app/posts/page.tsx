export const metadata = { title: "社区帖子" };

import Link from "next/link";
import { PostFeed, type PostFeedItem } from "@/components/post-feed";
import { EmptyState } from "@/components/empty-state";
import { RetryButton } from "@/components/retry-button";
import { UiIcon } from "@/components/ui-icon";
import { getAuthContext } from "@/lib/auth";
import { getLiveAnnouncements } from "@/lib/announcements";
import {
  formatPostDate,
  getPostsFeed,
  type PostsFeedScope,
  type PostsFeedSort,
} from "@/lib/posts";
import "./posts.css";

type PostsPageProps = {
  searchParams: Promise<{
    q?: string;
    scope?: string;
    sort?: string;
    page?: string;
  }>;
};

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  const auth = await getAuthContext();

  const scope: PostsFeedScope =
    params.scope === "public" || (params.scope === "members" && auth.user)
      ? params.scope
      : "all";
  const sort: PostsFeedSort =
    params.sort === "likes" || params.sort === "comments"
      ? params.sort
      : "latest";
  const query = (params.q ?? "").trim();
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const [feedResult, announcements] = await Promise.all([
    getPostsFeed({ page, query, scope, sort }),
    getLiveAnnouncements(3),
  ]);

  const failed = feedResult.status === "error";
  const feed: PostFeedItem[] = feedResult.posts.map((post) => ({
    ...post,
    dateLabel: formatPostDate(post.createdAt),
  }));
  const { stats, hotPosts } = feedResult;
  const hasHotActivity = hotPosts.some(
    (post) => post.likesCount + post.commentsCount > 0,
  );
  const isFiltered = scope !== "all" || Boolean(query) || sort !== "latest";

  return (
    <div className="page-shell comms-page">
      <section className="comms-hero">
        <div className="comms-hero-grid" aria-hidden="true" />
        <div className="comms-hero-glow" aria-hidden="true" />
        <span className="comms-hero-mark" aria-hidden="true">
          COMMS
        </span>
        <nav className="ui-breadcrumb comms-crumb" aria-label="当前位置">
          <Link href="/">DQ 战队</Link>
          <UiIcon name="chevron" size={12} />
          <span>社区帖子</span>
        </nav>
        <div className="comms-hero-main">
          <p className="comms-eyebrow">
            <span className="comms-live-dot" aria-hidden="true" />
            DQ COMMS · 成员社区
          </p>
          <h1>
            社区帖子
            <span className="comms-caret" aria-hidden="true" />
          </h1>
          <p className="comms-hero-desc">
            聊对局，记复盘，分享属于 DQ 的日常。让每一次交流，都成为下一场默契的开始。
          </p>
          <div className="ui-actions comms-hero-actions">
            <Link
              href="/posts/create"
              className="ui-button ui-button--primary"
            >
              <UiIcon name="pen" size={16} />
              发布帖子
              <UiIcon name="arrow" size={17} />
            </Link>
            {!auth.user ? (
              <Link href="/login" className="ui-button">
                成员登录
                <UiIcon name="outward" size={16} />
              </Link>
            ) : null}
          </div>
        </div>
        <dl className="comms-stats">
          <div>
            <dt>社区帖子</dt>
            <dd>{failed ? "—" : stats.totalPosts}</dd>
          </div>
          <div>
            <dt>讨论评论</dt>
            <dd>
              {failed || feedResult.countsFailed ? "—" : stats.totalComments}
            </dd>
          </div>
          <div>
            <dt>收获点赞</dt>
            <dd>
              {failed || feedResult.countsFailed ? "—" : stats.totalLikes}
            </dd>
          </div>
          <div>
            <dt>发帖成员</dt>
            <dd>{failed ? "—" : stats.authorCount}</dd>
          </div>
        </dl>
        {feedResult.countsFailed && !failed ? (
          <p className="comms-hero-desc" role="status">
            互动数据暂时无法加载，点赞与评论数暂显示为 0，请稍后刷新重试。
          </p>
        ) : null}
      </section>

      <div className="comms-layout">
        <section aria-label="社区讨论" className="comms-feed-column">
          {failed ? (
            <div className="ui-empty" role="alert">
              <div className="ui-empty-symbol">
                <UiIcon name="shield" size={30} />
              </div>
              <h2>帖子暂时加载失败</h2>
              <p>
                社区服务暂时没有响应，不是没有内容。可以再试一次；如果多次失败，请联系战队管理员。
              </p>
              <div className="ui-actions">
                <RetryButton />
              </div>
            </div>
          ) : feedResult.total === 0 && !isFiltered ? (
            <EmptyState
              icon="message"
              title="第一篇故事，等你来写"
              description="暂时还没有可阅读的帖子。成员可以分享训练复盘、游戏心得，或最近的战队日常。"
              action={{ href: "/posts/create", label: "写一篇帖子" }}
            />
          ) : (
            <PostFeed
              posts={feed}
              isAuthenticated={Boolean(auth.user)}
              total={feedResult.total}
              page={feedResult.page}
              pageCount={feedResult.pageCount}
              scope={scope}
              sort={sort}
              query={query}
              scopeCounts={feedResult.scopeCounts}
            />
          )}
        </section>

        <aside className="comms-sidebar">
          {announcements.length ? (
            <section className="comms-panel comms-announcements">
              <p className="comms-panel-eyebrow">
                <UiIcon name="zap" size={13} />
                NOTICE
              </p>
              <h2>战队公告</h2>
              <ul>
                {announcements.map((announcement) => (
                  <li key={announcement.id}>
                    <p className="comms-announcement-title">
                      {announcement.isPinned ? <span>置顶</span> : null}
                      {announcement.title}
                    </p>
                    <p className="comms-announcement-content">
                      {announcement.content}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="comms-panel comms-compose">
            <p className="comms-panel-eyebrow">
              <UiIcon name="pen" size={13} />
              NEW POST
            </p>
            <h2>讨论从这里开始</h2>
            <p>
              {auth.user
                ? "记录一场对局的思考，也听听队友的不同看法。草稿和成员内容会按你的身份展示。"
                : "公开帖子可以直接阅读。成员登录后，还可以发布帖子、点赞和参与讨论。"}
            </p>
            {auth.user ? (
              <div className="comms-prompts">
                <Link href="/posts/create">训练复盘</Link>
                <Link href="/posts/create">对局思路</Link>
                <Link href="/posts/create">战队日常</Link>
              </div>
            ) : null}
            <Link
              href={auth.user ? "/posts/create" : "/login"}
              className="ui-button ui-button--primary comms-compose-cta"
            >
              {auth.user ? "分享我的想法" : "成员登录"}
              <UiIcon name="arrow" size={16} />
            </Link>
          </section>

          <section className="comms-panel comms-hot">
            <h2>
              <UiIcon name="flame" size={17} />
              {hasHotActivity ? "热议榜" : "最新帖子"}
            </h2>
            {hotPosts.length ? (
              <ol>
                {hotPosts.map((post, index) => (
                  <li key={post.id}>
                    <span className="comms-hot-rank" aria-hidden="true">
                      {index + 1}
                    </span>
                    <div>
                      <Link href={`/posts/${post.id}`}>{post.title}</Link>
                      <p>
                        <span>
                          <UiIcon name="heart" size={12} />
                          {post.likesCount}
                        </span>
                        <span>
                          <UiIcon name="message" size={12} />
                          {post.commentsCount}
                        </span>
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="comms-hot-empty">
                {failed
                  ? "热议榜暂时无法加载。"
                  : "还没有帖子。发布第一篇，让讨论从这里开始。"}
              </p>
            )}
          </section>

          <section className="comms-panel comms-code">
            <h2>让交流更有价值</h2>
            <ol>
              <li>
                <span aria-hidden="true">01</span>
                聊具体的对局，也讲清自己的思路。
              </li>
              <li>
                <span aria-hidden="true">02</span>
                尊重队友，对事不对人。
              </li>
              <li>
                <span aria-hidden="true">03</span>
                好经验值得分享，好建议值得倾听。
              </li>
            </ol>
          </section>

          <Link href="/#recruitment" className="comms-join">
            还不是成员？了解入队
            <UiIcon name="outward" size={15} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
