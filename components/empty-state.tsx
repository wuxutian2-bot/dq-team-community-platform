import Link from "next/link";
import { UiIcon, type IconName } from "@/components/ui-icon";

export function EmptyState({
  icon = "book",
  title,
  description,
  action,
  secondary,
  headingLevel = 2,
}: {
  icon?: IconName;
  title: string;
  description: string;
  action?: { href: string; label: string };
  secondary?: { href: string; label: string };
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <div className="ui-empty">
      <div className="ui-empty-symbol">
        <UiIcon name={icon} size={32} />
      </div>
      <Heading>{title}</Heading>
      <p>{description}</p>
      {action || secondary ? (
        <div className="ui-actions">
          {action ? (
            <Link href={action.href} className="ui-button ui-button--primary">
              {action.label}
              <UiIcon name="arrow" size={17} />
            </Link>
          ) : null}
          {secondary ? (
            <Link href={secondary.href} className="ui-button ui-button--quiet">
              {secondary.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
