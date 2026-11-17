"use client";

import { useFormStatus } from "react-dom";

type ConfirmSubmitButtonProps = {
  label: string;
  pendingLabel: string;
  className: string;
  confirmMessage: string;
};

export function ConfirmSubmitButton({
  label,
  pendingLabel,
  className,
  confirmMessage,
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`ui-submit ${className}`}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? <span className="ui-spinner" aria-hidden="true" /> : null}
      {pending ? pendingLabel : label}
    </button>
  );
}