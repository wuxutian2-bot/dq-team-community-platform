import { EmptyState } from "@/components/empty-state";

export default function NotFound() {
  return (
    <div className="page-shell">
      <EmptyState
        headingLevel={1}
        icon="search"
        title="这一页，暂时没有找到"
        description="链接可能已更新，或者内容尚未公开。回到熟悉的地方，再继续探索 DQ。"
        action={{ href: "/", label: "返回首页" }}
        secondary={{ href: "/posts", label: "看看社区帖子" }}
      />
    </div>
  );
}
