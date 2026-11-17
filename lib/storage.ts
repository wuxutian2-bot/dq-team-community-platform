import "server-only";

import { randomUUID } from "node:crypto";
import { getSupabasePublicEnv, hasSupabasePublicEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const STORAGE_BUCKETS = {
  avatars: "avatars",
  postCovers: "post-covers",
  achievementImages: "achievement-images",
} as const;

type StorageBucketName =
  (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function getFileExtension(fileName: string, mimeType: string) {
  const extensionFromName = fileName.split(".").pop()?.toLowerCase();

  if (extensionFromName && extensionFromName.length <= 5) {
    return extensionFromName;
  }

  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

function normalizePathPart(value: string) {
  return value.replace(/[^a-zA-Z0-9/_-]+/g, "-").replace(/-+/g, "-");
}

function encodeStoragePath(path: string) {
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

export function getStoragePublicUrl(
  bucket: StorageBucketName,
  path: string | null | undefined,
) {
  if (!path || !hasSupabasePublicEnv()) {
    return null;
  }

  const { url } = getSupabasePublicEnv();
  return `${url}/storage/v1/object/public/${bucket}/${encodeStoragePath(path)}`;
}

export async function getStorageSignedUrl(
  bucket: StorageBucketName,
  path: string | null | undefined,
  expiresIn = 3600,
) {
  if (!path) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

export async function getStorageSignedUrls(
  bucket: StorageBucketName,
  paths: (string | null | undefined)[],
  expiresIn = 3600,
) {
  const uniquePaths = [...new Set(paths.filter((path): path is string => Boolean(path)))];
  const urls = new Map<string, string>();

  if (!uniquePaths.length) {
    return urls;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUrls(uniquePaths, expiresIn);

  if (error || !data) {
    return urls;
  }

  data.forEach((entry) => {
    if (entry.path && entry.signedUrl) {
      urls.set(entry.path, entry.signedUrl);
    }
  });

  return urls;
}

export async function uploadImageToStorage(options: {
  bucket: StorageBucketName;
  file: File;
  folder: string;
}) {
  const { bucket, file, folder } = options;

  if (!file || file.size === 0) {
    return null;
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw new Error("仅支持 JPG、PNG 或 WEBP 图片。");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("图片大小不能超过 5MB。");
  }

  const extension = getFileExtension(file.name, file.type);
  const objectPath = `${normalizePathPart(folder)}/${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const admin = createSupabaseAdminClient();
  const { error } = await admin.storage.from(bucket).upload(objectPath, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw error;
  }

  return objectPath;
}

// 只应在数据库记录确认指向新文件（或记录已删除）后调用；失败仅记日志，不影响主流程
export async function removeStorageFiles(
  bucket: StorageBucketName,
  paths: (string | null | undefined)[],
) {
  const targets = [...new Set(paths.filter((path): path is string => Boolean(path)))];

  if (!targets.length) {
    return;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.storage.from(bucket).remove(targets);

  if (error) {
    console.error("[storage] 清理图片文件失败", { bucket, targets, error });
  }
}
