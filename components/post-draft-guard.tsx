"use client";

import { useEffect, useRef } from "react";

const DRAFT_KEY = "dq:post-create-draft";
const SUBMITTED_KEY = "dq:post-create-submitted";
const TEXT_FIELDS = ["title", "excerpt", "content", "visibility", "status"];

type DraftData = Record<string, string | boolean>;

function readDraft(): DraftData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? (parsed as DraftData) : null;
  } catch {
    return null;
  }
}

export function PostDraftGuard({ hasError }: { hasError: boolean }) {
  const anchorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const form = anchorRef.current?.closest("form");
    if (!form) {
      return;
    }

    const draft = readDraft();
    const submitted = sessionStorage.getItem(SUBMITTED_KEY) === "1";
    sessionStorage.removeItem(SUBMITTED_KEY);

    if (submitted && !hasError) {
      // 上一次提交成功跳转到了帖子页，草稿已完成使命
      localStorage.removeItem(DRAFT_KEY);
    } else if (draft) {
      TEXT_FIELDS.forEach((key) => {
        const field = form.elements.namedItem(key);
        const value = draft[key];
        if (
          field instanceof HTMLInputElement ||
          field instanceof HTMLTextAreaElement ||
          field instanceof HTMLSelectElement
        ) {
          if (typeof value === "string") {
            field.value = value;
          }
        }
      });
      const comments = form.elements.namedItem("comments_enabled");
      if (
        comments instanceof HTMLInputElement &&
        typeof draft.comments_enabled === "boolean"
      ) {
        comments.checked = draft.comments_enabled;
      }
      if (anchorRef.current) {
        anchorRef.current.hidden = false;
      }
    }

    let timer: number | undefined;
    const save = () => {
      const data: DraftData = {};
      TEXT_FIELDS.forEach((key) => {
        const field = form.elements.namedItem(key);
        if (
          field instanceof HTMLInputElement ||
          field instanceof HTMLTextAreaElement ||
          field instanceof HTMLSelectElement
        ) {
          data[key] = field.value;
        }
      });
      const comments = form.elements.namedItem("comments_enabled");
      if (comments instanceof HTMLInputElement) {
        data.comments_enabled = comments.checked;
      }
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      } catch {
        // 存储空间不足时静默放弃草稿
      }
    };
    const scheduleSave = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(save, 400);
    };
    const onSubmit = () => {
      save();
      sessionStorage.setItem(SUBMITTED_KEY, "1");
    };

    form.addEventListener("input", scheduleSave);
    form.addEventListener("change", scheduleSave);
    form.addEventListener("submit", onSubmit);
    return () => {
      window.clearTimeout(timer);
      form.removeEventListener("input", scheduleSave);
      form.removeEventListener("change", scheduleSave);
      form.removeEventListener("submit", onSubmit);
    };
  }, [hasError]);

  return (
    <span
      ref={anchorRef}
      hidden
      className="rounded-[22px] border border-accent/20 bg-accent/[0.08] px-5 py-3 text-xs leading-6 text-muted"
      role="status"
    >
      已恢复上次未提交的本地草稿，内容只保存在这台设备的浏览器里。
    </span>
  );
}