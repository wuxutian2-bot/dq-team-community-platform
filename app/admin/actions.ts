"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildRedirectPath, getAuthContext } from "@/lib/auth";
import { getDefaultTeamEventSeed } from "@/lib/history";
import { buildWorkbookMemberImportPlan } from "@/lib/member-bulk-import";
import { STORAGE_BUCKETS, removeStorageFiles, uploadImageToStorage } from "@/lib/storage";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TEAM_POSITIONS } from "@/lib/team-positions";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function getNumber(formData: FormData, key: string) {
  const value = Number(getString(formData, key));
  return Number.isFinite(value) ? value : null;
}

function textLength(value: string) {
  return Array.from(value).length;
}

function adminPath(pathname: string, message?: string, error?: string) {
  return buildRedirectPath(pathname, { message, error });
}

function getAdminRedirectTarget(formData: FormData, fallbackPath: string) {
  const target = getString(formData, "redirect_to");
  return target.startsWith("/admin/") ? target : fallbackPath;
}

type AuthContext = Awaited<ReturnType<typeof getAuthContext>>;
type AdminAuthContext = AuthContext & {
  user: NonNullable<AuthContext["user"]>;
  profile: NonNullable<AuthContext["profile"]>;
};
type CaptainAuthContext = AdminAuthContext & {
  profile: AdminAuthContext["profile"] & {
    role_level: 1;
  };
};

async function requireAdmin(pathname: string): Promise<AdminAuthContext> {
  const auth = await getAuthContext();

  if (!auth.user) {
    redirect(
      buildRedirectPath("/login", {
        next: pathname,
        error: "请先登录后再进入后台操作。",
      }),
    );
  }

  if (!auth.profile || auth.profile.status !== "active" || auth.profile.role_level > 2) {
    redirect(
      adminPath(pathname, undefined, "当前账号没有后台操作权限。"),
    );
  }

  return auth as AdminAuthContext;
}

async function requireCaptain(pathname: string): Promise<CaptainAuthContext> {
  const auth = await requireAdmin(pathname);

  if (auth.profile.role_level !== 1) {
    redirect(
      adminPath(pathname, undefined, "只有队长可以修改成员权限等级。"),
    );
  }

  return auth as CaptainAuthContext;
}

async function requireTargetManageable(
  auth: AdminAuthContext,
  userId: string,
  pathname: string,
) {
  if (auth.profile.role_level === 1 || userId === auth.user.id) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("role_level")
    .eq("id", userId)
    .maybeSingle<{ role_level: number }>();

  if (target && target.role_level <= 2) {
    redirect(
      adminPath(pathname, undefined, "只有队长可以修改队长或副队的账号。"),
    );
  }
}

function revalidateAdmin(paths: string[]) {
  paths.forEach((path) => revalidatePath(path));
}

type CreateManagedMemberAccountInput = {
  email: string;
  password: string;
  displayName: string;
  positionTitle: string | null;
  joinedAt: string;
};

type CreateManagedMemberAccountResult =
  | {
      ok: true;
      userId: string;
    }
  | {
      ok: false;
      reason: "duplicate_email" | "auth_create_failed" | "profile_insert_failed";
      message: string;
    };

function isDuplicateEmailError(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("already") ||
    normalized.includes("registered") ||
    normalized.includes("duplicate") ||
    normalized.includes("exists")
  );
}

async function createManagedMemberAccount(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  input: CreateManagedMemberAccountInput,
): Promise<CreateManagedMemberAccountResult> {
  const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      display_name: input.displayName,
    },
  });

  if (createError || !createdUser.user) {
    const message = createError?.message ?? "成员账号创建失败。";

    if (isDuplicateEmailError(message)) {
      return {
        ok: false,
        reason: "duplicate_email",
        message,
      };
    }

    return {
      ok: false,
      reason: "auth_create_failed",
      message,
    };
  }

  await admin.from("profiles").delete().eq("id", createdUser.user.id);

  const { error: profileError } = await admin.from("profiles").insert({
    id: createdUser.user.id,
    email: input.email,
    display_name: input.displayName,
    position_title: input.positionTitle,
    joined_at: input.joinedAt,
    role_level: 3,
    status: "active",
    is_profile_public: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(createdUser.user.id);

    return {
      ok: false,
      reason: "profile_insert_failed",
      message: profileError.message,
    };
  }

  return {
    ok: true,
    userId: createdUser.user.id,
  };
}

export async function adminCreateMemberAccount(formData: FormData) {
  await requireAdmin("/admin/users");

  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");
  const displayName = getString(formData, "display_name");
  const positionTitle = getString(formData, "position_title");
  const joinedAt = getString(formData, "joined_at");

  if (!email || !email.includes("@")) {
    redirect(adminPath("/admin/users", undefined, "请输入有效的成员邮箱。"));
  }

  if (password.length < 8) {
    redirect(adminPath("/admin/users", undefined, "初始密码至少需要 8 位。"));
  }

  if (!displayName || textLength(displayName) > 40) {
    redirect(
      adminPath("/admin/users", undefined, "成员显示名称不能为空，且不能超过 40 个字符。"),
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(joinedAt)) {
    redirect(adminPath("/admin/users", undefined, "请选择有效的加入时间。"));
  }

  const admin = createSupabaseAdminClient();
  const result = await createManagedMemberAccount(admin, {
    email,
    password,
    displayName,
    positionTitle: positionTitle || null,
    joinedAt,
  });

  if (!result.ok) {
    if (result.reason === "duplicate_email") {
      redirect(adminPath("/admin/users", undefined, "该邮箱对应的成员账号已经存在。"));
    }

    if (result.reason === "profile_insert_failed") {
      redirect(adminPath("/admin/users", undefined, "账号已创建，但资料初始化失败。"));
    }

    redirect(adminPath("/admin/users", undefined, "成员账号创建失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/users", "/members"]);
  redirect(adminPath("/admin/users", "成员账号已创建，默认已激活为正式成员。"));
}

export async function adminResetMemberPassword(formData: FormData) {
  const auth = await requireAdmin("/admin/users");
  const userId = getString(formData, "user_id");
  const password = getString(formData, "password");
  const redirectTarget = getAdminRedirectTarget(formData, "/admin/users");

  if (!userId) {
    redirect(adminPath(redirectTarget, undefined, "密码重置请求无效。"));
  }

  if (password.length < 8 || password.length > 72) {
    redirect(
      adminPath(redirectTarget, undefined, "新密码长度需要在 8 到 72 位之间。"),
    );
  }

  await requireTargetManageable(auth, userId, redirectTarget);

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });

  if (error) {
    redirect(adminPath(redirectTarget, undefined, "密码重置失败，请稍后重试。"));
  }

  redirect(
    adminPath(
      redirectTarget,
      "密码已重置。请通过安全渠道告知成员，并提醒其登录后在个人中心自行修改。",
    ),
  );
}

export async function adminImportMembersFromWorkbook() {
  await requireAdmin("/admin/users");

  let importPlan;

  try {
    importPlan = await buildWorkbookMemberImportPlan();
  } catch (error) {
    redirect(
      adminPath(
        "/admin/users",
        undefined,
        error instanceof Error ? error.message : "批量导入准备失败，请检查 Excel 文件。",
      ),
    );
  }

  const admin = createSupabaseAdminClient();
  let createdCount = 0;
  let skippedExistingCount = 0;
  let failedCount = 0;
  const failedRows: string[] = [];

  for (const row of importPlan.candidates) {
    const result = await createManagedMemberAccount(admin, {
      email: row.email,
      password: row.password,
      displayName: row.displayName,
      positionTitle: "成员",
      joinedAt: row.joinedAt,
    });

    if (result.ok) {
      createdCount += 1;
      continue;
    }

    if (result.reason === "duplicate_email") {
      skippedExistingCount += 1;
      continue;
    }

    failedCount += 1;

    if (failedRows.length < 5) {
      failedRows.push(`第 ${row.rowNumber} 行（${row.email}）`);
    }
  }

  revalidateAdmin(["/admin", "/admin/users", "/members"]);

  const message =
    `Excel 批量导入已完成：共扫描 ${importPlan.totalDataRows} 行，` +
    `成功创建 ${createdCount} 个，` +
    `因无可用昵称或加入时间异常跳过 ${importPlan.skippedRows.length} 个，` +
    `因账号已存在跳过 ${skippedExistingCount} 个，` +
    `失败 ${failedCount} 个。` +
    (createdCount > 0
      ? "新账号的初始密码为随机强密码，请在成员编辑页用“重置密码”设置初始密码并分发给成员。"
      : "");
  const error =
    failedRows.length > 0 ? `失败示例：${failedRows.join("、")}。` : undefined;

  redirect(
    buildRedirectPath("/admin/users", {
      message,
      error,
    }),
  );
}

export async function adminUpdateUserStatus(formData: FormData) {
  const auth = await requireAdmin("/admin/users");
  const userId = getString(formData, "user_id");
  const status = getString(formData, "status");

  if (!userId || !["pending", "active", "disabled"].includes(status)) {
    redirect(adminPath("/admin/users", undefined, "成员状态更新请求无效。"));
  }

  if (auth.user.id === userId && status !== "active") {
    redirect(adminPath("/admin/users", undefined, "不能在后台停用或挂起当前登录管理员。"));
  }

  await requireTargetManageable(auth, userId, "/admin/users");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", userId);

  if (error) {
    redirect(adminPath("/admin/users", undefined, "成员状态更新失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/users", "/members"]);
  redirect(adminPath("/admin/users", "成员状态已更新。"));
}

export async function adminUpdateUserDisplayName(formData: FormData) {
  const auth = await requireAdmin("/admin/users");
  const userId = getString(formData, "user_id");
  const currentSlug = getString(formData, "current_slug");
  const displayName = getString(formData, "display_name");

  if (!userId) {
    redirect(adminPath("/admin/users", undefined, "成员名称更新请求无效。"));
  }

  if (textLength(displayName) < 1 || textLength(displayName) > 40) {
    redirect(
      adminPath("/admin/users", undefined, "成员名称长度需要在 1 到 40 个字符之间。"),
    );
  }

  await requireTargetManageable(auth, userId, "/admin/users");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", userId);

  if (error) {
    redirect(adminPath("/admin/users", undefined, "成员名称更新失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/users", "/members", "/posts", "/profile"]);

  if (currentSlug) {
    revalidatePath(`/members/${currentSlug}`);
  }

  redirect(adminPath("/admin/users", "成员名称已更新。"));
}

export async function adminUpdateUserJoinedAt(formData: FormData) {
  const auth = await requireAdmin("/admin/users");
  const userId = getString(formData, "user_id");
  const currentSlug = getString(formData, "current_slug");
  const joinedAt = getString(formData, "joined_at");

  if (!userId) {
    redirect(adminPath("/admin/users", undefined, "成员加入时间更新请求无效。"));
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(joinedAt)) {
    redirect(adminPath("/admin/users", undefined, "请选择有效的加入时间。"));
  }

  await requireTargetManageable(auth, userId, "/admin/users");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ joined_at: joinedAt })
    .eq("id", userId);

  if (error) {
    redirect(adminPath("/admin/users", undefined, "成员加入时间更新失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/users", "/members", "/posts", "/profile"]);

  if (currentSlug) {
    revalidatePath(`/members/${currentSlug}`);
  }

  redirect(adminPath("/admin/users", "成员加入时间已更新。"));
}

export async function adminUpdateUserPosition(formData: FormData) {
  const auth = await requireAdmin("/admin/users");
  const userId = getString(formData, "user_id");
  const currentSlug = getString(formData, "current_slug");
  const positionTitle = getString(formData, "position_title");

  if (!userId || !TEAM_POSITIONS.includes(positionTitle as (typeof TEAM_POSITIONS)[number])) {
    redirect(adminPath("/admin/users", undefined, "成员职位更新请求无效。"));
  }

  await requireTargetManageable(auth, userId, "/admin/users");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ position_title: positionTitle })
    .eq("id", userId);

  if (error) {
    redirect(adminPath("/admin/users", undefined, "成员职位更新失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/users", "/members", "/posts", "/profile"]);

  if (currentSlug) {
    revalidatePath(`/members/${currentSlug}`);
  }

  redirect(adminPath("/admin/users", "成员职位已更新。"));
}

export async function adminUpdateUserRole(formData: FormData) {
  const auth = await requireCaptain("/admin/users");
  const userId = getString(formData, "user_id");
  const roleLevel = getNumber(formData, "role_level");

  if (!userId || !roleLevel || ![1, 2, 3, 4].includes(roleLevel)) {
    redirect(adminPath("/admin/users", undefined, "成员权限更新请求无效。"));
  }

  if (auth.user.id === userId) {
    redirect(adminPath("/admin/users", undefined, "为避免锁死后台，暂不支持修改当前登录队长自己的权限。"));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role_level: roleLevel })
    .eq("id", userId);

  if (error) {
    redirect(adminPath("/admin/users", undefined, "成员权限更新失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/users", "/members", "/profile"]);
  redirect(adminPath("/admin/users", "成员权限等级已更新。"));
}

export async function adminUpdateUserDisplayNameOnDetail(formData: FormData) {
  const auth = await requireAdmin("/admin/users");
  const userId = getString(formData, "user_id");
  const currentSlug = getString(formData, "current_slug");
  const displayName = getString(formData, "display_name");
  const redirectTarget = getAdminRedirectTarget(formData, "/admin/users");

  if (!userId) {
    redirect(adminPath(redirectTarget, undefined, "成员名字更新请求无效。"));
  }

  if (textLength(displayName) < 1 || textLength(displayName) > 40) {
    redirect(adminPath(redirectTarget, undefined, "成员名字长度需要在 1 到 40 个字符之间。"));
  }

  await requireTargetManageable(auth, userId, redirectTarget);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", userId);

  if (error) {
    redirect(adminPath(redirectTarget, undefined, "成员名字更新失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/users", "/members", "/posts", "/profile"]);

  if (currentSlug) {
    revalidatePath(`/members/${currentSlug}`);
  }

  redirect(adminPath(redirectTarget, "成员名字已更新。"));
}

export async function adminUpdateUserJoinedAtOnDetail(formData: FormData) {
  const auth = await requireAdmin("/admin/users");
  const userId = getString(formData, "user_id");
  const currentSlug = getString(formData, "current_slug");
  const joinedAt = getString(formData, "joined_at");
  const redirectTarget = getAdminRedirectTarget(formData, "/admin/users");

  if (!userId) {
    redirect(adminPath(redirectTarget, undefined, "成员加入时间更新请求无效。"));
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(joinedAt)) {
    redirect(adminPath(redirectTarget, undefined, "请选择有效的加入时间。"));
  }

  await requireTargetManageable(auth, userId, redirectTarget);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ joined_at: joinedAt })
    .eq("id", userId);

  if (error) {
    redirect(adminPath(redirectTarget, undefined, "成员加入时间更新失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/users", "/members", "/posts", "/profile"]);

  if (currentSlug) {
    revalidatePath(`/members/${currentSlug}`);
  }

  redirect(adminPath(redirectTarget, "成员加入时间已更新。"));
}

export async function adminUpdateUserPositionOnDetail(formData: FormData) {
  const auth = await requireAdmin("/admin/users");
  const userId = getString(formData, "user_id");
  const currentSlug = getString(formData, "current_slug");
  const positionTitle = getString(formData, "position_title");
  const redirectTarget = getAdminRedirectTarget(formData, "/admin/users");

  if (!userId || !TEAM_POSITIONS.includes(positionTitle as (typeof TEAM_POSITIONS)[number])) {
    redirect(adminPath(redirectTarget, undefined, "成员职位更新请求无效。"));
  }

  await requireTargetManageable(auth, userId, redirectTarget);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ position_title: positionTitle })
    .eq("id", userId);

  if (error) {
    redirect(adminPath(redirectTarget, undefined, "成员职位更新失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/users", "/members", "/posts", "/profile"]);

  if (currentSlug) {
    revalidatePath(`/members/${currentSlug}`);
  }

  redirect(adminPath(redirectTarget, "成员职位已更新。"));
}

export async function adminUpdateUserStatusOnDetail(formData: FormData) {
  const auth = await requireAdmin("/admin/users");
  const userId = getString(formData, "user_id");
  const status = getString(formData, "status");
  const redirectTarget = getAdminRedirectTarget(formData, "/admin/users");

  if (!userId || !["pending", "active", "disabled"].includes(status)) {
    redirect(adminPath(redirectTarget, undefined, "成员状态更新请求无效。"));
  }

  if (auth.user.id === userId && status !== "active") {
    redirect(adminPath(redirectTarget, undefined, "不能在后台停用或挂起当前登录管理员。"));
  }

  await requireTargetManageable(auth, userId, redirectTarget);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", userId);

  if (error) {
    redirect(adminPath(redirectTarget, undefined, "成员状态更新失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/users", "/members"]);
  redirect(adminPath(redirectTarget, "成员状态已更新。"));
}

export async function adminUpdateUserRoleOnDetail(formData: FormData) {
  const auth = await requireCaptain("/admin/users");
  const userId = getString(formData, "user_id");
  const roleLevel = getNumber(formData, "role_level");
  const redirectTarget = getAdminRedirectTarget(formData, "/admin/users");

  if (!userId || !roleLevel || ![1, 2, 3, 4].includes(roleLevel)) {
    redirect(adminPath(redirectTarget, undefined, "成员权限更新请求无效。"));
  }

  if (auth.user.id === userId) {
    redirect(adminPath(redirectTarget, undefined, "为避免锁死后台，暂不支持修改当前登录队长自己的权限。"));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role_level: roleLevel })
    .eq("id", userId);

  if (error) {
    redirect(adminPath(redirectTarget, undefined, "成员权限更新失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/users", "/members", "/profile"]);
  redirect(adminPath(redirectTarget, "成员权限等级已更新。"));
}

export async function adminUpdatePost(formData: FormData) {
  await requireAdmin("/admin/posts");
  const postId = getNumber(formData, "post_id");
  const status = getString(formData, "status");
  const visibility = getString(formData, "visibility");
  const commentsEnabled = getBoolean(formData, "comments_enabled");

  if (
    !postId ||
    !["draft", "published", "hidden", "archived"].includes(status) ||
    !["public", "members"].includes(visibility)
  ) {
    redirect(adminPath("/admin/posts", undefined, "帖子更新请求无效。"));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("posts")
    .update({
      status,
      visibility,
      comments_enabled: commentsEnabled,
    })
    .eq("id", postId);

  if (error) {
    redirect(adminPath("/admin/posts", undefined, "帖子更新失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/posts", "/posts", `/posts/${postId}`]);
  redirect(adminPath("/admin/posts", "帖子状态已更新。"));
}

export async function adminDeletePost(formData: FormData) {
  await requireAdmin("/admin/posts");
  const postId = getNumber(formData, "post_id");

  if (!postId) {
    redirect(adminPath("/admin/posts", undefined, "帖子删除请求无效。"));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) {
    redirect(adminPath("/admin/posts", undefined, "帖子删除失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/posts", "/posts"]);
  redirect(adminPath("/admin/posts", "帖子已删除。"));
}

export async function adminUpdateCommentStatus(formData: FormData) {
  await requireAdmin("/admin/comments");
  const commentId = getNumber(formData, "comment_id");
  const status = getString(formData, "status");

  if (!commentId || !["visible", "hidden", "deleted"].includes(status)) {
    redirect(adminPath("/admin/comments", undefined, "评论状态更新请求无效。"));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("comments")
    .update({ status })
    .eq("id", commentId);

  if (error) {
    redirect(adminPath("/admin/comments", undefined, "评论状态更新失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/comments", "/posts"]);
  redirect(adminPath("/admin/comments", "评论状态已更新。"));
}

export async function adminSeedDefaultHistory() {
  const auth = await requireAdmin("/admin/history");
  const supabase = await createSupabaseServerClient();

  const { count, error: countError } = await supabase
    .from("team_events")
    .select("id", { count: "exact", head: true });

  if (countError) {
    redirect(adminPath("/admin/history", undefined, "读取成长史现有数据失败，请稍后重试。"));
  }

  if ((count ?? 0) > 0) {
    redirect(
      adminPath(
        "/admin/history",
        "成长史数据库里已经有内容了。为避免重复导入，这次没有再次写入默认 S19-S42 赛季数据。",
      ),
    );
  }

  const defaultSeed = getDefaultTeamEventSeed().map((event) => ({
    ...event,
    created_by: auth.user.id,
    updated_by: auth.user.id,
  }));

  const { error } = await supabase.from("team_events").insert(defaultSeed);

  if (error) {
    redirect(adminPath("/admin/history", undefined, "默认成长史导入失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/history", "/history"]);
  redirect(adminPath("/admin/history", "默认 S19-S42 成长史已经正式写入数据库。"));
}

export async function adminCreateTeamEvent(formData: FormData) {
  const auth = await requireAdmin("/admin/history");
  const title = getString(formData, "title");
  const summary = getString(formData, "summary");
  const content = getString(formData, "content");
  const eventDate = getString(formData, "event_date");
  const seasonCode = getString(formData, "season_code").toUpperCase();
  const isPublic = getBoolean(formData, "is_public");
  const isPublished = getBoolean(formData, "is_published");

  if (!title || title.length > 120) {
    redirect(adminPath("/admin/history", undefined, "成长节点标题不能为空，且不能超过 120 个字符。"));
  }

  if (summary.length > 280) {
    redirect(adminPath("/admin/history", undefined, "成长节点摘要不能超过 280 个字符。"));
  }

  if (!eventDate) {
    redirect(adminPath("/admin/history", undefined, "请填写成长节点日期。"));
  }

  if (seasonCode && !/^S\d{1,3}$/.test(seasonCode)) {
    redirect(adminPath("/admin/history", undefined, "赛季编号格式应为 S 加 1 到 3 位数字，例如 S43。"));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("team_events").insert({
    title,
    summary,
    content,
    event_date: eventDate,
    season_code: seasonCode || null,
    is_public: isPublic,
    is_published: isPublished,
    created_by: auth.user.id,
    updated_by: auth.user.id,
  });

  if (error) {
    redirect(adminPath("/admin/history", undefined, "成长节点创建失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/history", "/history"]);
  redirect(adminPath("/admin/history", "成长节点已创建。"));
}

export async function adminUpdateTeamEvent(formData: FormData) {
  const auth = await requireAdmin("/admin/history");
  const eventId = getNumber(formData, "event_id");
  const isPublic = getBoolean(formData, "is_public");
  const isPublished = getBoolean(formData, "is_published");

  if (!eventId) {
    redirect(adminPath("/admin/history", undefined, "成长节点更新请求无效。"));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("team_events")
    .update({
      is_public: isPublic,
      is_published: isPublished,
      updated_by: auth.user.id,
    })
    .eq("id", eventId);

  if (error) {
    redirect(adminPath("/admin/history", undefined, "成长节点更新失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/history", "/history"]);
  redirect(adminPath("/admin/history", "成长节点状态已更新。"));
}

export async function adminDeleteTeamEvent(formData: FormData) {
  await requireAdmin("/admin/history");
  const eventId = getNumber(formData, "event_id");

  if (!eventId) {
    redirect(adminPath("/admin/history", undefined, "成长节点删除请求无效。"));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("team_events").delete().eq("id", eventId);

  if (error) {
    redirect(adminPath("/admin/history", undefined, "成长节点删除失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/history", "/history"]);
  redirect(adminPath("/admin/history", "成长节点已删除。"));
}

export async function adminCreateAchievement(formData: FormData) {
  const auth = await requireAdmin("/admin/achievements");
  const title = getString(formData, "title");
  const summary = getString(formData, "summary");
  const content = getString(formData, "content");
  const achievedAt = getString(formData, "achieved_at");
  const isPublic = getBoolean(formData, "is_public");
  const isPublished = getBoolean(formData, "is_published");
  const imageFile = formData.get("image_file");

  if (!title || title.length > 120) {
    redirect(adminPath("/admin/achievements", undefined, "荣誉标题不能为空，且不能超过 120 个字符。"));
  }

  if (summary.length > 280) {
    redirect(adminPath("/admin/achievements", undefined, "荣誉摘要不能超过 280 个字符。"));
  }

  if (!achievedAt) {
    redirect(adminPath("/admin/achievements", undefined, "请填写荣誉达成日期。"));
  }

  const supabase = await createSupabaseServerClient();
  let imagePath: string | null = null;

  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      imagePath = await uploadImageToStorage({
        bucket: STORAGE_BUCKETS.achievementImages,
        file: imageFile,
        folder: `achievements/${auth.user.id}`,
      });
    } catch (error) {
      console.error("[admin] 荣誉图片上传失败", error);
      redirect(
        adminPath(
          "/admin/achievements",
          undefined,
          error instanceof Error ? error.message : "荣誉图片上传失败，请稍后重试。",
        ),
      );
    }
  }

  const { error } = await supabase.from("achievements").insert({
    title,
    summary,
    content,
    achieved_at: achievedAt,
    image_path: imagePath,
    is_public: isPublic,
    is_published: isPublished,
    created_by: auth.user.id,
    updated_by: auth.user.id,
  });

  if (error) {
    console.error("[admin] 荣誉条目创建失败", error);
    await removeStorageFiles(STORAGE_BUCKETS.achievementImages, [imagePath]);
    redirect(adminPath("/admin/achievements", undefined, "荣誉条目创建失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/achievements", "/achievements"]);
  redirect(adminPath("/admin/achievements", "荣誉条目已创建。"));
}

export async function adminUpdateAchievement(formData: FormData) {
  const auth = await requireAdmin("/admin/achievements");
  const achievementId = getNumber(formData, "achievement_id");
  const isPublic = getBoolean(formData, "is_public");
  const isPublished = getBoolean(formData, "is_published");
  const imageFile = formData.get("image_file");

  if (!achievementId) {
    redirect(adminPath("/admin/achievements", undefined, "荣誉条目更新请求无效。"));
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("achievements")
    .select("image_path")
    .eq("id", achievementId)
    .maybeSingle<{ image_path: string | null }>();

  if (!existing) {
    redirect(adminPath("/admin/achievements", undefined, "荣誉条目不存在或已被删除。"));
  }

  let imagePath = existing.image_path;
  let uploadedImagePath: string | null = null;

  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      imagePath = await uploadImageToStorage({
        bucket: STORAGE_BUCKETS.achievementImages,
        file: imageFile,
        folder: `achievements/${auth.user.id}`,
      });
      uploadedImagePath = imagePath;
    } catch (error) {
      console.error("[admin] 荣誉图片上传失败", error);
      redirect(
        adminPath(
          "/admin/achievements",
          undefined,
          error instanceof Error ? error.message : "荣誉图片上传失败，请稍后重试。",
        ),
      );
    }
  }

  const { error } = await supabase
    .from("achievements")
    .update({
      image_path: imagePath,
      is_public: isPublic,
      is_published: isPublished,
      updated_by: auth.user.id,
    })
    .eq("id", achievementId);

  if (error) {
    console.error("[admin] 荣誉条目更新失败", { achievementId, error });
    await removeStorageFiles(STORAGE_BUCKETS.achievementImages, [uploadedImagePath]);
    redirect(adminPath("/admin/achievements", undefined, "荣誉条目更新失败，请稍后重试。"));
  }

  if (uploadedImagePath) {
    await removeStorageFiles(STORAGE_BUCKETS.achievementImages, [
      existing.image_path,
    ]);
  }

  revalidateAdmin(["/admin", "/admin/achievements", "/achievements"]);
  redirect(adminPath("/admin/achievements", "荣誉条目状态已更新。"));
}

export async function adminDeleteAchievement(formData: FormData) {
  await requireAdmin("/admin/achievements");
  const achievementId = getNumber(formData, "achievement_id");

  if (!achievementId) {
    redirect(adminPath("/admin/achievements", undefined, "荣誉条目删除请求无效。"));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("achievements")
    .delete()
    .eq("id", achievementId);

  if (error) {
    redirect(adminPath("/admin/achievements", undefined, "荣誉条目删除失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/achievements", "/achievements"]);
  redirect(adminPath("/admin/achievements", "荣誉条目已删除。"));
}

export async function adminCreateAnnouncement(formData: FormData) {
  const auth = await requireAdmin("/admin/announcements");
  const title = getString(formData, "title");
  const content = getString(formData, "content");
  const audience = getString(formData, "audience");
  const isPinned = getBoolean(formData, "is_pinned");
  const isPublished = getBoolean(formData, "is_published");
  const startsAt = getString(formData, "starts_at");
  const endsAt = getString(formData, "ends_at");

  if (!title || title.length > 120) {
    redirect(adminPath("/admin/announcements", undefined, "公告标题不能为空，且不能超过 120 个字符。"));
  }

  if (!content) {
    redirect(adminPath("/admin/announcements", undefined, "请填写公告正文。"));
  }

  if (!["public", "members", "admins"].includes(audience)) {
    redirect(adminPath("/admin/announcements", undefined, "公告受众设置无效。"));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("site_announcements").insert({
    title,
    content,
    audience,
    is_pinned: isPinned,
    is_published: isPublished,
    starts_at: startsAt || null,
    ends_at: endsAt || null,
    created_by: auth.user.id,
    updated_by: auth.user.id,
  });

  if (error) {
    redirect(adminPath("/admin/announcements", undefined, "公告创建失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/announcements"]);
  redirect(adminPath("/admin/announcements", "公告已创建。"));
}

export async function adminUpdateAnnouncement(formData: FormData) {
  const auth = await requireAdmin("/admin/announcements");
  const announcementId = getNumber(formData, "announcement_id");
  const audience = getString(formData, "audience");
  const isPinned = getBoolean(formData, "is_pinned");
  const isPublished = getBoolean(formData, "is_published");

  if (!announcementId || !["public", "members", "admins"].includes(audience)) {
    redirect(adminPath("/admin/announcements", undefined, "公告更新请求无效。"));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("site_announcements")
    .update({
      audience,
      is_pinned: isPinned,
      is_published: isPublished,
      updated_by: auth.user.id,
    })
    .eq("id", announcementId);

  if (error) {
    redirect(adminPath("/admin/announcements", undefined, "公告更新失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/announcements"]);
  redirect(adminPath("/admin/announcements", "公告状态已更新。"));
}

export async function adminDeleteAnnouncement(formData: FormData) {
  await requireAdmin("/admin/announcements");
  const announcementId = getNumber(formData, "announcement_id");

  if (!announcementId) {
    redirect(adminPath("/admin/announcements", undefined, "公告删除请求无效。"));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("site_announcements")
    .delete()
    .eq("id", announcementId);

  if (error) {
    redirect(adminPath("/admin/announcements", undefined, "公告删除失败，请稍后重试。"));
  }

  revalidateAdmin(["/admin", "/admin/announcements"]);
  redirect(adminPath("/admin/announcements", "公告已删除。"));
}
