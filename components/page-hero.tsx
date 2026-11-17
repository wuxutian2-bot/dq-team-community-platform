import Link from "next/link";
import type { ReactNode } from "react";
import { UiIcon } from "@/components/ui-icon";

type Action = { href: string; label: string; variant: "primary" | "secondary" };
type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: Action[];
  aside?: ReactNode;
};

export function PageHero({
  title,
  description,
  actions = [],
  aside,
}: PageHeroProps) {
  return (
    <section className={`page-hero${aside ? " page-hero--aside" : ""}`}>
      <div className="page-hero-content">
        <nav className="ui-breadcrumb" aria-label="当前位置">
          <Link href="/">DQ 战队</Link>
          <UiIcon name="chevron" size={12} />
          <span>{title}</span>
        </nav>
        <h1>{title}</h1>
        <p className="page-hero-description">{description}</p>
        {actions.length ? (
          <div className="ui-actions">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`ui-button ui-button--${action.variant === "primary" ? "primary" : "secondary"}`}
              >
                {action.label}
                <UiIcon
                  name={action.variant === "primary" ? "arrow" : "outward"}
                  size={17}
                />
              </Link>
            ))}
          </div>
        ) : null}
      </div>
      {aside ? <div className="page-hero-aside">{aside}</div> : null}
    </section>
  );
}
