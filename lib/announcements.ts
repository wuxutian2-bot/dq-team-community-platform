import "server-only";

import { hasSupabasePublicEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AnnouncementRecord = {
  id: number;
  title: string;
  content: string;
  is_pinned: boolean;
  starts_at: string | null;
  created_at: string;
};

export type LiveAnnouncement = {
  id: number;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
};

export async function getLiveAnnouncements(limit = 3): Promise<LiveAnnouncement[]> {
  if (!hasSupabasePublicEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("site_announcements")
    .select("id, title, content, is_pinned, starts_at, created_at")
    .eq("is_published", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as AnnouncementRecord[]).map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    isPinned: announcement.is_pinned,
    createdAt: announcement.created_at,
  }));
}