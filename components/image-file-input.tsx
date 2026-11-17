"use client";

import { useState } from "react";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ImageFileInput({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <input
        type="file"
        name={name}
        accept="image/png,image/jpeg,image/webp"
        className={className}
        onChange={(event) => {
          const input = event.currentTarget;
          const file = input.files?.[0];
          let message = "";

          if (file) {
            if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
              message = "仅支持 JPG、PNG 或 WEBP 图片。";
            } else if (file.size > MAX_IMAGE_SIZE_BYTES) {
              message = "图片大小不能超过 5MB，请压缩后再上传。";
            }
          }

          input.setCustomValidity(message);
          setError(message || null);
          if (message) {
            input.reportValidity();
          }
        }}
      />
      {error ? (
        <span className="text-xs leading-6 text-rose-300" role="alert">
          {error}
        </span>
      ) : null}
    </>
  );
}