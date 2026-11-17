import Image from "next/image";
import Link from "next/link";
import { CopyContact } from "@/components/copy-contact";
import { getLiveAnnouncements } from "@/lib/announcements";
import "./home.css";

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const exploreLinks = [
  { href: "/members", title: "并肩的队友", description: "认识 DQ 战队成员", label: "成员展示" },
  { href: "/history", title: "走过的每一步", description: "回看战队成长记录", label: "成长史" },
  { href: "/achievements", title: "属于我们的高光", description: "收藏荣誉与里程碑", label: "荣誉墙" },
];

export default async function Home() {
  const announcements = await getLiveAnnouncements(3);

  return (
    <div className={"dq-home-home"}>
      <section className={"dq-home-hero"} aria-labelledby="home-title">
        <div className={"dq-home-heroArtwork"}>
          <Image src="/images/dq-poster.jpg" alt="" fill priority sizes="(max-width: 720px) 100vw, 75vw" className={"dq-home-poster"} />
        </div>
        <div className={"dq-home-heroContent"}>
          <h1 id="home-title" className={"dq-home-title"}>黑域<span>集结<span className={"dq-home-titlePeriod"}>.</span></span></h1>
          <p className={"dq-home-motto"}>RISE THROUGH DISCIPLINE</p>
          <p className={"dq-home-heroDescription"}>DQ 战队成长记录与成员社区平台</p>
          <div className={"dq-home-heroActions"}>
            <a href="#recruitment" className={"dq-home-primaryAction"}>加入 DQ 战队<Arrow /></a>
            <Link href="/about" className={"dq-home-secondaryAction"}>了解战队<Arrow diagonal /></Link>
          </div>
        </div>
        <div className={"dq-home-heroBottom"}>
          <span className={"dq-home-heroSignature"}>DIANQI<span>殿祁战队</span></span>
          <a href="/images/dq-poster.jpg" target="_blank" rel="noopener noreferrer" className={"dq-home-posterLink"} aria-label="查看完整招募海报（新窗口）">查看完整招募海报<Arrow diagonal /></a>
        </div>
      </section>

      {announcements.length ? (
        <section className={"dq-home-announcements"} aria-label="战队公告">
          <p className={"dq-home-announcementsHeading"}>NOTICE · 战队公告</p>
          {announcements.map((announcement) => (
            <article key={announcement.id} className={"dq-home-announcement"}>
              <h2 className={"dq-home-announcementTitle"}>
                {announcement.isPinned ? (
                  <span className={"dq-home-announcementPin"}>置顶</span>
                ) : null}
                {announcement.title}
              </h2>
              <p className={"dq-home-announcementContent"}>{announcement.content}</p>
            </article>
          ))}
        </section>
      ) : null}

      <section id="recruitment" className={"dq-home-recruitment"} aria-labelledby="recruitment-title">
        <div className={"dq-home-recruitmentIntro"}>
          <h2 id="recruitment-title">下一场，<br />一起上场。</h2>
          <p>想加入 DQ 战队或参与战队审核，请添加审核群。群内会同步审核流程、试训安排和成员通知。</p>
        </div>
        <div className={"dq-home-contactDetails"}>
          <div className={"dq-home-groupContact"}>
            <div>
              <h3>战队审核群 <span>QQ</span></h3>
              <p className={"dq-home-groupNumber"}>664051406</p>
            </div>
            <CopyContact value="664051406" label="复制群号" />
          </div>
          <dl className={"dq-home-contactMeta"}>
            <div><dt>常驻审核员</dt><dd><span>慕夏</span><span className={"dq-home-contactNumber"}>2840468047</span></dd></div>
            <div><dt>正常工作时间</dt><dd className={"dq-home-hours"}>8:00 <span>—</span> 24:00</dd></div>
          </dl>
        </div>
      </section>

      <section className={"dq-home-explore"} aria-labelledby="explore-title">
        <div className={"dq-home-sectionHeading"}>
          <h2 id="explore-title">在这里，留下我们的故事。</h2>
          <Link href="/posts">前往社区<Arrow diagonal /></Link>
        </div>
        <div className={"dq-home-exploreLinks"}>
          {exploreLinks.map((item) => (
            <Link key={item.href} href={item.href} className={"dq-home-exploreLink"}>
              <span className={"dq-home-exploreLabel"}>{item.label}</span>
              <h3>{item.title}</h3>
              <span className={"dq-home-exploreDescription"}>{item.description}</span>
              <span className={"dq-home-exploreArrow"}><Arrow diagonal /></span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
