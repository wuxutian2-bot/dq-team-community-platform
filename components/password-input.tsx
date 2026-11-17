"use client";

import { useState } from "react";
import { UiIcon } from "@/components/ui-icon";

type PasswordInputProps = {
  name?: string;
  id?: string;
  autoComplete?: string;
  placeholder?: string;
  minLength?: number;
};

export function PasswordInput({
  name = "password",
  id = "member-password",
  autoComplete = "current-password",
  placeholder = "请输入管理员分配的密码",
  minLength,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="ui-password">
      <input
        id={id}
        type={visible ? "text" : "password"}
        name={name}
        autoComplete={autoComplete}
        placeholder={placeholder}
        minLength={minLength}
        required
      />
      <button
        type="button"
        aria-label={visible ? "隐藏密码" : "显示密码"}
        aria-pressed={visible}
        aria-controls={id}
        onClick={() => setVisible(!visible)}
      >
        <UiIcon name={visible ? "eye-off" : "eye"} size={19} />
      </button>
    </div>
  );
}