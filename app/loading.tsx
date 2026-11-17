export default function Loading() {
  return (
    <div
      className="page-shell"
      role="status"
      aria-label="正在加载页面"
      aria-busy="true"
    >
      <span className="sr-only">正在加载页面，请稍候。</span>
      <div className="ui-skeleton" aria-hidden="true">
        <div
          className="ui-skeleton-line"
          style={{ width: "25%", height: 26 }}
        />
        <div className="ui-skeleton-line" style={{ width: "65%" }} />
        <div className="ui-skeleton-line" style={{ width: "45%" }} />
      </div>
      <div className="ui-skeleton" aria-hidden="true">
        <div className="ui-skeleton-line" />
        <div className="ui-skeleton-line" style={{ width: "55%" }} />
      </div>
    </div>
  );
}
