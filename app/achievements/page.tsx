export const metadata = { title: "荣誉墙" };

import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { EmptyState } from "@/components/empty-state";
import { UiIcon } from "@/components/ui-icon";
import { getAchievementsFeed, formatAchievementDate } from "@/lib/achievements";
import { getAuthContext } from "@/lib/auth";

export default async function AchievementsPage() {
  const [auth, achievements] = await Promise.all([
    getAuthContext(),
    getAchievementsFeed(),
  ]);
  const isManager = (auth.profile?.role_level ?? 99) <= 2;
  return (
    <div className="page-shell">
      <PageHero
        title="荣誉墙"
        description="把值得铭记的时刻，留给每一位并肩作战的队友。这里收录战队的赛事成绩、活动成果与共同的高光。"
      />
      {isManager ? (
        <p className="ui-notice">
          当前为管理视角，包含你有权查看的未公开或未发布荣誉。
        </p>
      ) : null}
      <div className="honor-summary">
        <p className="ui-count">
          <strong>{achievements.length}</strong>份可查看的荣誉档案
        </p>
        <Link className="ui-text-link" href="/history">
          回看赛季历程
          <UiIcon name="outward" size={17} />
        </Link>
      </div>
      {achievements.length ? (
        <section className="honor-grid" aria-label="战队荣誉档案">
          {achievements.map((achievement) => (
            <article key={achievement.id} className="honor-card">
              {achievement.imageUrl ? (
                <Image
                  src={achievement.imageUrl}
                  alt={`${achievement.title}荣誉记录`}
                  width={720}
                  height={420}
                  className="honor-card-image"
                />
              ) : (
                <div className="honor-card-top">
                  <span className="honor-year">{achievement.yearLabel}</span>
                  <UiIcon name="trophy" size={44} />
                </div>
              )}
              <div className="honor-card-content">
                <span
                  className="ui-pill ui-pill--subtle"
                  style={{ alignSelf: "start" }}
                >
                  {achievement.visibilityLabel}
                </span>
                <h2>{achievement.title}</h2>
                <p>{achievement.summary}</p>
                {achievement.content ? (
                  <details>
                    <summary>查看荣誉记录</summary>
                    <p>{achievement.content}</p>
                  </details>
                ) : null}
                <time dateTime={achievement.achievedAt}>
                  {formatAchievementDate(achievement.achievedAt)}
                </time>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          icon="trophy"
          title="荣誉值得认真记录"
          description="暂无已公开的荣誉档案。你可以先在成长史中，回看战队各个赛季留下的印记。"
          action={{ href: "/history", label: "回看成长史" }}
        />
      )}
      <section className="honor-crosslink">
        <div>
          <h2>每份荣誉背后，都有一段历程。</h2>
          <p>不只看见高光，也记得一起走过的路。</p>
        </div>
        <Link href="/history" className="ui-button">
          探索赛季档案
          <UiIcon name="arrow" size={17} />
        </Link>
      </section>
    </div>
  );
}
