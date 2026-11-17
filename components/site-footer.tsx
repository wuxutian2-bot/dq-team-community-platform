import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div><Link href="/" className="site-footer-brand">DQ<span>殿祁战队</span></Link><p>成长记录与成员社区平台</p></div>
        <nav aria-label="页脚导航"><Link href="/about">战队介绍</Link><Link href="/posts">社区帖子</Link><Link href="/login">成员入口</Link></nav>
        <span className="site-footer-motto">RISE THROUGH DISCIPLINE</span>
      </div>
    </footer>
  );
}
