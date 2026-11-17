import "server-only";

import { hasSupabasePublicEnv } from "@/lib/env";
import { getStorageSignedUrls, STORAGE_BUCKETS } from "@/lib/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { achievementShowcase } from "@/lib/site-data";

type AchievementRecord = {
  id: number;
  title: string;
  summary: string;
  content: string;
  achieved_at: string;
  image_path: string | null;
  sort_order: number;
  is_public: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type AchievementViewModel = {
  id: number;
  title: string;
  summary: string;
  content: string;
  achievedAt: string;
  yearLabel: string;
  sortOrder: number;
  isPublic: boolean;
  isPublished: boolean;
  visibilityLabel: string;
  imageUrl: string | null;
  imagePath: string | null;
};

function getVisibilityLabel(achievement: Pick<AchievementViewModel, "isPublic" | "isPublished">) {
  if (!achievement.isPublished) {
    return "未发布";
  }

  return achievement.isPublic ? "公开荣誉" : "仅后台可见";
}

function toAchievementViewModel(
  achievement: AchievementRecord,
  imageUrl: string | null,
): AchievementViewModel {
  return {
    id: achievement.id,
    title: achievement.title,
    summary: achievement.summary,
    content: achievement.content,
    achievedAt: achievement.achieved_at,
    yearLabel: achievement.achieved_at.slice(0, 4),
    sortOrder: achievement.sort_order,
    isPublic: achievement.is_public,
    isPublished: achievement.is_published,
    visibilityLabel: getVisibilityLabel({
      isPublic: achievement.is_public,
      isPublished: achievement.is_published,
    }),
    imageUrl,
    imagePath: achievement.image_path,
  };
}

function getFallbackAchievements(): AchievementViewModel[] {
  return achievementShowcase.map((item, index) => ({
    id: index + 1,
    title: item.title,
    summary: item.description,
    content: `${item.description} 后续接入后台后，可以继续补充赛事背景、参与成员、海报图与详细过程。`,
    achievedAt: `${item.year}-06-01`,
    yearLabel: item.year,
    sortOrder: index,
    isPublic: true,
    isPublished: true,
    visibilityLabel: "演示数据",
    imageUrl: null,
    imagePath: null,
  }));
}

export async function getAchievementsFeed() {
  if (!hasSupabasePublicEnv()) {
    return getFallbackAchievements();
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("achievements")
    .select(
      "id, title, summary, content, achieved_at, image_path, sort_order, is_public, is_published, created_at, updated_at",
    )
    .order("achieved_at", { ascending: false })
    .order("sort_order", { ascending: true });

  const achievements = (data ?? []) as AchievementRecord[];
  const imageUrls = await getStorageSignedUrls(
    STORAGE_BUCKETS.achievementImages,
    achievements.map((achievement) => achievement.image_path),
  );

  return achievements.map((achievement) =>
    toAchievementViewModel(
      achievement,
      achievement.image_path
        ? imageUrls.get(achievement.image_path) ?? null
        : null,
    ),
  );
}

export function formatAchievementDate(value: string) {
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
