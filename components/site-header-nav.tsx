"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { publicNavigation } from "@/lib/site-data";

type SiteHeaderNavProps = {
  isAuthenticated: boolean;
  canAccessAdmin: boolean;
  accountActions?: ReactNode;
};

function isActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeaderNav({
  isAuthenticated,
  canAccessAdmin,
  accountActions,
}: SiteHeaderNavProps) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const isOpen = openPath === pathname;
  const sourceNavigation = pathname.startsWith("/admin")
    ? [
        { href: "/", label: "返回官网" },
        { href: "/admin", label: "管理工作台" },
      ]
    : publicNavigation;
  const navItems = sourceNavigation.filter(
    (item) => item.href !== "/profile" && item.href !== "/login",
  );

  return (
    <div
      className="site-navigation"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpenPath(null);
          event.currentTarget
            .querySelector<HTMLButtonElement>("button")
            ?.focus();
        }
      }}
    >
      <button
        type="button"
        className="site-menu-toggle"
        aria-expanded={isOpen}
        aria-controls="site-navigation-panel"
        onClick={() => setOpenPath(isOpen ? null : pathname)}
      >
        <span>{isOpen ? "收起导航" : "浏览战队"}</span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d={isOpen ? "m6 6 12 12M6 18 18 6" : "M4 7h16M4 12h16M4 17h16"}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <div
        id="site-navigation-panel"
        className={`site-navigation-panel${isOpen ? " is-open" : ""}`}
      >
        <nav
          className="site-nav-links"
          aria-label={pathname.startsWith("/admin") ? "后台导航" : "主导航"}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              onClick={() => setOpenPath(null)}
              className={
                isActive(pathname, item.href) ? "is-active" : undefined
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="site-nav-actions">
          <Link
            href={isAuthenticated ? "/profile" : "/login"}
            className="site-login"
            onClick={() => setOpenPath(null)}
          >
            {isAuthenticated ? "个人中心" : "成员登录"}
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 12h14m-5-5 5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          {canAccessAdmin ? (
            <Link
              href="/admin"
              className="site-admin-link"
              onClick={() => setOpenPath(null)}
            >
              管理后台
            </Link>
          ) : null}
          {accountActions}
        </div>
      </div>
    </div>
  );
}
