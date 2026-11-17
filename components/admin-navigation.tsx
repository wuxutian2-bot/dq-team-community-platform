"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavigation } from "@/lib/site-data";
import { UiIcon, type IconName } from "@/components/ui-icon";

const icons: IconName[] = [
  "shield",
  "users",
  "book",
  "message",
  "clock",
  "trophy",
  "message",
  "shield",
];
export function AdminNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="管理模块导航">
      {adminNavigation.map((item, index) => {
        const active =
          item.href === "/admin"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
          >
            <UiIcon name={icons[index] ?? "book"} size={17} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
