"use client";

import Image from "next/image";
import { useState } from "react";

export function MemberAvatar({
  src,
  initials,
  size = 64,
}: {
  src: string | null;
  initials: string;
  size?: number;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  if (!src || failedSource === src) {
    return (
      <span className="member-avatar" aria-hidden="true">
        {initials}
      </span>
    );
  }

  return (
    <Image
      key={attempt}
      src={src}
      width={size}
      height={size}
      alt=""
      className="member-avatar"
      onError={() => {
        // 冷缓存下图片优化器偶发失败，重试一次再回退文字，避免头像被永久降级
        if (attempt === 0) {
          setTimeout(() => setAttempt(1), 1500);
        } else {
          setFailedSource(src);
        }
      }}
    />
  );
}
