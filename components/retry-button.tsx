"use client";

import { useRouter } from "next/navigation";

export function RetryButton({ label = "重新加载" }: { label?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="ui-button ui-button--primary"
      onClick={() => router.refresh()}
    >
      {label}
    </button>
  );
}