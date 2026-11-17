"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  label: string;
  pendingLabel: string;
  className: string;
};

export function SubmitButton({
  label,
  pendingLabel,
  className,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`ui-submit ${className}`}
    >
      {pending ? <span className="ui-spinner" aria-hidden="true" /> : null}
      {pending ? pendingLabel : label}
    </button>
  );
}
