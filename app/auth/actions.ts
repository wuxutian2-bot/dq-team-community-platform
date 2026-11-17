"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildRedirectPath, sanitizeNextPath } from "@/lib/auth";
import { hasSupabasePublicEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getEntryString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function login(formData: FormData) {
  const nextPath = sanitizeNextPath(getEntryString(formData.get("next")));
  const email = getEntryString(formData.get("email")).toLowerCase();
  const password = getEntryString(formData.get("password"));

  if (!hasSupabasePublicEnv()) {
    redirect(
      buildRedirectPath("/login", {
        error: "请先配置 Supabase 环境变量后再尝试登录。",
        next: nextPath,
      }),
    );
  }

  if (!email || !password) {
    redirect(
      buildRedirectPath("/login", {
        error: "请输入邮箱和密码。",
        next: nextPath,
      }),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const detail =
      process.env.NODE_ENV !== "production" && error.message
        ? `（Supabase: ${error.message}）`
        : "";

    redirect(
      buildRedirectPath("/login", {
        error: `登录失败，请检查邮箱和密码是否正确${detail}`,
        next: nextPath,
      }),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      buildRedirectPath("/login", {
        error: "登录状态未建立，请重试。",
        next: nextPath,
      }),
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", user.id)
    .maybeSingle<{ status: "pending" | "active" | "disabled" }>();

  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();

    redirect(
      buildRedirectPath("/login", {
        error:
          profile?.status === "disabled"
            ? "该账号已被停用，请联系队长。"
            : "该账号尚未激活，请联系管理员开通成员权限。",
        next: nextPath,
      }),
    );
  }

  revalidatePath("/", "layout");
  redirect(nextPath);
}

export async function logout() {
  if (hasSupabasePublicEnv()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
  }

  redirect(
    buildRedirectPath("/login", {
      message: "你已安全退出登录。",
    }),
  );
}
