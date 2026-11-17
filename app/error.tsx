"use client";

import Link from "next/link";
import { UiIcon } from "@/components/ui-icon";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="page-shell">
      <div className="ui-empty" role="alert">
        <div className="ui-empty-symbol">
          <UiIcon name="shield" size={30} />
        </div>
        <h1>页面暂时没有加载完成</h1>
        <p>可以再试一次。如果仍然无法打开，请稍后返回，或联系战队管理员。</p>
        <div className="ui-actions">
          <button
            type="button"
            className="ui-button ui-button--primary"
            onClick={reset}
          >
            重新加载
          </button>
          <Link href="/" className="ui-button ui-button--quiet">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
