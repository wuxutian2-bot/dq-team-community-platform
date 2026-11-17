import Link from "next/link";
import { Panel } from "@/components/panel";

type AdminPaginationProps = {
  basePath: string;
  page: number;
  totalPages: number;
  total: number;
};

const linkClassName =
  "inline-flex items-center justify-center rounded-full border border-border bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:border-accent/45 hover:text-accent";
const disabledClassName =
  "inline-flex cursor-not-allowed items-center justify-center rounded-full border border-white/[0.06] bg-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted/60";

export function AdminPagination({
  basePath,
  page,
  totalPages,
  total,
}: AdminPaginationProps) {
  return (
    <Panel className="flex flex-wrap items-center justify-between gap-4 p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-muted">
        共 {total} 条 · 第 {page} / {totalPages} 页
      </p>
      <div className="flex gap-3">
        {page > 1 ? (
          <Link href={`${basePath}?page=${page - 1}`} className={linkClassName}>
            上一页
          </Link>
        ) : (
          <span className={disabledClassName} aria-disabled="true">
            上一页
          </span>
        )}
        {page < totalPages ? (
          <Link href={`${basePath}?page=${page + 1}`} className={linkClassName}>
            下一页
          </Link>
        ) : (
          <span className={disabledClassName} aria-disabled="true">
            下一页
          </span>
        )}
      </div>
    </Panel>
  );
}