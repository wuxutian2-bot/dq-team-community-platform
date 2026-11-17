"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildRedirectPath, getAuthContext } from "@/lib/auth";
import { STORAGE_BUCKETS, removeStorageFiles, uploadImageToStorage } from "@/lib/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptional(value: string) {
  return value ? value : null;
}

function textLength(value: string) {
  return Array.from(value).length;
}

export async function changePassword(formData: FormData) {
  const auth = await getAuthContext();

  if (!auth.user) {
    redirect(
      buildRedirectPath("/login", {
        next: "/profile",
        error: "登录状态已失效，请重新登录后再修改密码。",
      }),
    );
  }

  const password = getString(formData, "new_password");
  const confirm = getString(formData, "confirm_password");

  if (password.length < 8 || password.length > 72) {
    redirect(
      buildRedirectPath("/profile", {
        error: "新密码长度需要在 8 到 72 位之间。",
      }),
    );
  }

  if (password !== confirm) {
    redirect(
      buildRedirectPath("/profile", {
        error: "两次输入的新密码不一致，请重新输入。",
      }),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(
      buildRedirectPath("/profile", {
        error: "密码修改失败，请稍后重试；如多次失败请联系管理员。",
      }),
    );
  }

  revalidatePath("/profile");
  redirect(
    buildRedirectPath("/profile", {
      message: "密码已修改，下次登录请使用新密码。",
    }),
  );
}

function validateUsername(value: string) {
  if (!value) {
    return null;
  }

  if (value.length < 3 || value.length > 24) {
    return "用户名长度需要在 3 到 24 个字符之间。";
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    return "用户名只能使用字母、数字、下划线和短横线。";
  }

  return null;
}

export async function updateProfile(formData: FormData) {
  const auth = await getAuthContext();

  if (!auth.user) {
    redirect(
      buildRedirectPath("/login", {
        next: "/profile",
        error: "登录状态已失效，请重新登录。",
      }),
    );
  }

  if (!auth.profile) {
    redirect(
      buildRedirectPath("/profile", {
        error: "当前账号还没有同步成员资料，请联系管理员检查 profiles 数据。",
      }),
    );
  }

  const displayName = getString(formData, "display_name");
  const usernameInput = getString(formData, "username");
  const username = usernameInput.toLowerCase();
  const bio = getString(formData, "bio");
  const favoriteGame = getString(formData, "favorite_game");
  const requestedPositionTitle = getString(formData, "position_title");
  const isProfilePublic = formData.get("is_profile_public") === "on";
  const currentSlug = getString(formData, "current_slug");
  const avatarFile = formData.get("avatar");
  const canEditPosition = auth.profile.role_level <= 2;
  const nextPositionTitle = canEditPosition
    ? normalizeOptional(requestedPositionTitle)
    : auth.profile.position_title;

  if (textLength(displayName) < 1 || textLength(displayName) > 40) {
    redirect(
      buildRedirectPath("/profile", {
        error: "显示名称长度需要在 1 到 40 个字符之间。",
      }),
    );
  }

  if (bio.length > 500) {
    redirect(
      buildRedirectPath("/profile", {
        error: "个人简介不能超过 500 个字符。",
      }),
    );
  }

  if (
    auth.profile.role_level > 2 &&
    requestedPositionTitle &&
    requestedPositionTitle !== (auth.profile.position_title ?? "")
  ) {
    redirect(
      buildRedirectPath("/profile", {
        error: "只有 Level 1 和 Level 2 成员可以修改战队职位。",
      }),
    );
  }

  const usernameError = validateUsername(username);
  if (usernameError) {
    redirect(
      buildRedirectPath("/profile", {
        error: usernameError,
      }),
    );
  }

  const supabase = await createSupabaseServerClient();
  let avatarPath = auth.profile.avatar_path;
  let uploadedAvatarPath: string | null = null;

  if (avatarFile instanceof File && avatarFile.size > 0) {
    try {
      avatarPath = await uploadImageToStorage({
        bucket: STORAGE_BUCKETS.avatars,
        file: avatarFile,
        folder: `profiles/${auth.user.id}`,
      });
      uploadedAvatarPath = avatarPath;
    } catch (error) {
      console.error("[profile] 头像上传失败", error);
      redirect(
        buildRedirectPath("/profile", {
          error:
            error instanceof Error
              ? error.message
              : "头像上传失败，请稍后重试。",
        }),
      );
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      username: normalizeOptional(username),
      bio,
      avatar_path: avatarPath,
      favorite_game: normalizeOptional(favoriteGame),
      position_title: nextPositionTitle,
      is_profile_public: isProfilePublic,
    })
    .eq("id", auth.user.id);

  if (error) {
    console.error("[profile] 资料更新失败", error);
    await removeStorageFiles(STORAGE_BUCKETS.avatars, [uploadedAvatarPath]);
    redirect(
      buildRedirectPath("/profile", {
        error:
          error.code === "23505"
            ? "该用户名已被占用，请换一个新的用户名。"
            : "资料保存失败，请稍后重试。",
      }),
    );
  }

  if (uploadedAvatarPath) {
    await removeStorageFiles(STORAGE_BUCKETS.avatars, [
      auth.profile.avatar_path,
    ]);
  }

  revalidatePath("/profile");
  revalidatePath("/members");

  if (currentSlug) {
    revalidatePath(`/members/${currentSlug}`);
  }

  if (username) {
    revalidatePath(`/members/${username}`);
  }

  redirect(
    buildRedirectPath("/profile", {
      message: "资料已更新。",
    }),
  );
}
