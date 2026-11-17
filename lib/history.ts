import "server-only";

import { hasSupabasePublicEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TeamEventRecord = {
  id: number;
  title: string;
  summary: string;
  content: string;
  event_date: string;
  season_code: string | null;
  cover_image_path: string | null;
  sort_order: number;
  is_public: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

type SeasonMilestone = {
  seasonCode: string;
  title: string;
  date: string;
};

export type DefaultTeamEventSeed = {
  title: string;
  summary: string;
  content: string;
  event_date: string;
  season_code: string;
  sort_order: number;
  is_public: boolean;
  is_published: boolean;
};

export type TeamEventViewModel = {
  id: number;
  title: string;
  summary: string;
  content: string;
  eventDate: string;
  seasonCode: string | null;
  yearLabel: string;
  sortOrder: number;
  isPublic: boolean;
  isPublished: boolean;
  visibilityLabel: string;
};

type GetTeamEventsFeedOptions = {
  fallbackWhenEmpty?: boolean;
};

const defaultSeasonMilestones: SeasonMilestone[] = [
  { seasonCode: "S19", title: "突围赛事战队", date: "2020-07-01" },
  { seasonCode: "S20", title: "区级赛事战队", date: "2020-09-01" },
  { seasonCode: "S21", title: "省级赛事战队", date: "2021-01-01" },
  { seasonCode: "S22", title: "省级百强战队", date: "2021-04-01" },
  { seasonCode: "S23", title: "省级百强战队", date: "2021-06-01" },
  { seasonCode: "S24", title: "省级百强战队", date: "2021-09-01" },
  { seasonCode: "S25", title: "市级十强战队", date: "2022-01-01" },
  { seasonCode: "S26", title: "省级百强战队", date: "2022-04-01" },
  { seasonCode: "S27", title: "市级赛事战队", date: "2022-06-01" },
  { seasonCode: "S28", title: "省级十强战队", date: "2022-09-01" },
  { seasonCode: "S29", title: "市级十强战队", date: "2023-01-01" },
  { seasonCode: "S30", title: "市级赛事战队", date: "2023-04-01" },
  { seasonCode: "S31", title: "区级赛事战队", date: "2023-06-01" },
  { seasonCode: "S32", title: "区级季军战队", date: "2023-09-01" },
  { seasonCode: "S33", title: "区级十强战队", date: "2024-01-01" },
  { seasonCode: "S34", title: "区级十强战队", date: "2024-03-01" },
  { seasonCode: "S35", title: "全国赛事战队", date: "2024-06-01" },
  { seasonCode: "S36", title: "省级百强战队", date: "2024-09-01" },
  { seasonCode: "S37", title: "区级亚军战队", date: "2024-12-01" },
  { seasonCode: "S38", title: "突围赛事战队", date: "2025-03-01" },
  { seasonCode: "S39", title: "突围赛事战队", date: "2025-07-01" },
  { seasonCode: "S40", title: "市级冠军战队", date: "2025-09-01" },
  { seasonCode: "S41", title: "区级冠军战队", date: "2026-01-01" },
  { seasonCode: "S42", title: "突围赛事战队", date: "2026-04-01" },
];

function getVisibilityLabel(event: Pick<TeamEventViewModel, "isPublic" | "isPublished">) {
  if (!event.isPublished) {
    return "未发布";
  }

  return event.isPublic ? "公开展示" : "仅后台可见";
}

function toTeamEventViewModel(event: TeamEventRecord): TeamEventViewModel {
  return {
    id: event.id,
    title: event.title,
    summary: event.summary,
    content: event.content,
    eventDate: event.event_date,
    seasonCode: event.season_code,
    yearLabel: event.event_date.slice(0, 4),
    sortOrder: event.sort_order,
    isPublic: event.is_public,
    isPublished: event.is_published,
    visibilityLabel: getVisibilityLabel({
      isPublic: event.is_public,
      isPublished: event.is_published,
    }),
  };
}

export function getDefaultTeamEventSeed(): DefaultTeamEventSeed[] {
  return defaultSeasonMilestones.map((event, index) => ({
    title: event.title,
    summary: `${event.seasonCode} 赛季最高水平`,
    content: `DQ 战队在 ${event.seasonCode} 赛季最高达到“${event.title}”，这是该赛季成长史的代表节点。`,
    event_date: event.date,
    season_code: event.seasonCode,
    sort_order: index,
    is_public: true,
    is_published: true,
  }));
}

function getFallbackEvents(): TeamEventViewModel[] {
  return getDefaultTeamEventSeed().map((event, index) => ({
    id: index + 1,
    title: event.title,
    summary: event.summary,
    content: event.content,
    eventDate: event.event_date,
    seasonCode: event.season_code,
    yearLabel: event.event_date.slice(0, 4),
    sortOrder: event.sort_order,
    isPublic: event.is_public,
    isPublished: event.is_published,
    visibilityLabel: "赛季档案",
  }));
}

export async function getTeamEventsFeed(
  options: GetTeamEventsFeedOptions = {},
) {
  const { fallbackWhenEmpty = false } = options;

  if (!hasSupabasePublicEnv()) {
    return getFallbackEvents();
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("team_events")
    .select(
      "id, title, summary, content, event_date, season_code, cover_image_path, sort_order, is_public, is_published, created_at, updated_at",
    )
    .order("event_date", { ascending: true })
    .order("sort_order", { ascending: true });

  const mapped = (data ?? []).map((event: unknown) =>
    toTeamEventViewModel(event as TeamEventRecord),
  );

  if (mapped.length === 0 && fallbackWhenEmpty) {
    return getFallbackEvents();
  }

  return mapped;
}

export function formatEventDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Shanghai",
  }).format(parsed);
}
