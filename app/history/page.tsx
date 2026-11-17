export const metadata = { title: "成长史" };

import Image from "next/image";
import { PageHero } from "@/components/page-hero";
import { EmptyState } from "@/components/empty-state";
import { getAuthContext } from "@/lib/auth";
import { getTeamEventsFeed, type TeamEventViewModel } from "@/lib/history";

type BadgeMeta = {
  src: string;
  alt: string;
  glowClass: string;
};

type HonorCounts = {
  national: number;
  province: number;
  city: number;
  district: number;
};

function formatSeasonDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    timeZone: "Asia/Shanghai",
  }).format(parsed);
}

function getBadgeMeta(title: string): BadgeMeta {
  if (title.includes("全国")) {
    return {
      src: "/images/history-badges/national.png",
      alt: "全国赛事标签",
      glowClass: "shadow-[0_18px_46px_rgba(255,198,84,0.22)]",
    };
  }

  if (title.includes("省级")) {
    return {
      src: "/images/history-badges/province.png",
      alt: "省级赛事标签",
      glowClass: "shadow-[0_18px_46px_rgba(155,122,255,0.16)]",
    };
  }

  if (title.includes("市级")) {
    return {
      src: "/images/history-badges/city.png",
      alt: "市级赛事标签",
      glowClass: "shadow-[0_18px_46px_rgba(111,171,255,0.16)]",
    };
  }

  if (title.includes("区级")) {
    return {
      src: "/images/history-badges/district.png",
      alt: "区级赛事标签",
      glowClass: "shadow-[0_18px_46px_rgba(71,203,165,0.16)]",
    };
  }

  return {
    src: "/images/history-badges/breakout.png",
    alt: "突围赛事标签",
    glowClass: "shadow-[0_18px_46px_rgba(113,175,255,0.14)]",
  };
}

function getHighestHonorEvent(events: TeamEventViewModel[]) {
  const explicitNational = events.find(
    (event) => event.title === "全国赛事战队",
  );
  if (explicitNational) {
    return explicitNational;
  }

  const national = events.find((event) => event.title.includes("全国"));
  if (national) {
    return national;
  }

  return events[0] ?? null;
}

function getHonorCounts(events: TeamEventViewModel[]): HonorCounts {
  return events.reduce<HonorCounts>(
    (counts, event) => {
      if (event.title.includes("全国")) {
        counts.national += 1;
      } else if (event.title.includes("省级")) {
        counts.province += 1;
      } else if (event.title.includes("市级")) {
        counts.city += 1;
      } else if (event.title.includes("区级")) {
        counts.district += 1;
      }

      return counts;
    },
    {
      national: 0,
      province: 0,
      city: 0,
      district: 0,
    },
  );
}

export default async function HistoryPage() {
  const [auth, events] = await Promise.all([
    getAuthContext(),
    getTeamEventsFeed({ fallbackWhenEmpty: true }),
  ]);
  const isManager = (auth.profile?.role_level ?? 99) <= 2;
  const orderedEvents = [...events].sort((left, right) =>
    left.eventDate === right.eventDate
      ? right.sortOrder - left.sortOrder
      : right.eventDate.localeCompare(left.eventDate),
  );
  const highestHonorEvent = getHighestHonorEvent(orderedEvents);
  const highestHonorSeason = highestHonorEvent?.seasonCode ?? "";
  const highestHonorBadge = highestHonorEvent
    ? getBadgeMeta(highestHonorEvent.title)
    : null;
  const honorCounts = getHonorCounts(orderedEvents);
  return (
    <div className="page-shell">
      <PageHero
        title="成长史"
        description="从一场场对局，到一个个赛季。每一次突破，都留下属于我们的印记。"
        actions={[
          { href: "/achievements", label: "查看荣誉墙", variant: "secondary" },
        ]}
      />
      {isManager ? (
        <p className="ui-notice">
          当前为管理视角，包含你有权查看的未公开或未发布档案。
        </p>
      ) : null}
      {orderedEvents.length ? (
        <>
          <section className="archive-summary" aria-label="战队荣耀概览">
            <div className="archive-peak">
              {highestHonorBadge ? (
                <div className="archive-peak-badge">
                  <Image
                    src={highestHonorBadge.src}
                    alt={highestHonorBadge.alt}
                    fill
                    sizes="86px"
                    className="object-contain"
                  />
                </div>
              ) : null}
              <div>
                <div className="archive-peak-label">
                  代表性荣耀{highestHonorSeason ? ` · ${highestHonorSeason}` : ""}
                </div>
                <h2>{highestHonorEvent?.title}</h2>
                <p>{highestHonorEvent?.summary}</p>
              </div>
            </div>
            <dl className="archive-stats">
              {[
                { label: "全国荣耀", value: honorCounts.national },
                { label: "省级荣耀", value: honorCounts.province },
                { label: "市级荣耀", value: honorCounts.city },
                { label: "区级荣耀", value: honorCounts.district },
              ].map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <div className="archive-section-heading">
            <h2>赛季档案</h2>
            <p>{orderedEvents.length} 个赛季记录 · 最新在前</p>
          </div>
          <section className="archive-grid" aria-label="赛季档案列表">
            {orderedEvents.map((event) => {
              const badge = getBadgeMeta(event.title);
              const season = event.seasonCode ?? "里程碑";
              return (
                <article key={event.id} className="archive-card">
                  <div className="archive-card-top">
                    <span className="archive-season">{season}</span>
                    <time dateTime={event.eventDate}>
                      {formatSeasonDate(event.eventDate)}
                    </time>
                  </div>
                  <div className="archive-card-badge">
                    <Image
                      src={badge.src}
                      alt={badge.alt}
                      fill
                      sizes="86px"
                      className="object-contain"
                    />
                  </div>
                  <h3>{event.title}</h3>
                  <p className="archive-card-summary">{event.summary}</p>
                  {isManager || event.visibilityLabel === "演示数据" ? (
                    <div style={{ marginTop: 12, textAlign: "center" }}>
                      <span className="ui-pill ui-pill--subtle">
                        {event.visibilityLabel}
                      </span>
                    </div>
                  ) : null}
                  <details>
                    <summary
                      aria-label={`展开${event.seasonCode ? `${event.seasonCode}赛季` : "档案"}记录`}
                    >
                      赛季记录
                    </summary>
                    <p>{event.content || "暂无详细记录。"}</p>
                  </details>
                </article>
              );
            })}
          </section>
        </>
      ) : (
        <EmptyState
          icon="clock"
          title="第一份档案，正在路上"
          description="暂无可公开的成长记录。战队发布新的赛季档案后，你可以在这里回看每一步。"
          action={{ href: "/about", label: "先认识 DQ" }}
        />
      )}
    </div>
  );
}
