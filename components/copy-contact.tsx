"use client";

import { useState } from "react";

export function CopyContact({ value, label }: { value: string; label: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="contact-copy">
      <button type="button" className="contact-copy-button" onClick={copy}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {status === "copied" ? <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> : <><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M15 8V4H4v11h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></>}
        </svg>
        {status === "copied" ? "已复制" : label}
      </button>
      <span role="status" className={status === "error" ? "contact-copy-error" : "sr-only"}>
        {status === "copied" ? "群号已复制到剪贴板" : status === "error" ? "复制未成功，请长按或选中群号复制。" : ""}
      </span>
    </div>
  );
}
