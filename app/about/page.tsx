export const metadata = { title: "战队介绍" };

import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import "./about.css";

const foundedAt = new Date("2020-04-19");

const rosterStats = [
  {
    label: "成立时间",
    value: "2020.04.19",
    detail: "从 2020 年春天集结到现在，已经一起走过六个春夏秋冬。",
  },
  {
    label: "核心定位",
    value: "综合型电竞战队",
    detail: "覆盖多游戏品类、兼顾赛事与社区氛围，既能打，也能长期一起玩。",
  },
  {
    label: "活跃领域",
    value: "手机 / 电脑 / 主机",
    detail: "哪里有对局、赛事和活动，哪里就有 DQ 的身影。",
  },
];

const gamePortfolio = [
  {
    title: "王者荣耀",
    tag: "MOBA",
    image: "hok",
    href: "https://pvp.qq.com/",
    detail: "主战场，战队当前最成熟、氛围最稳定的核心分部。",
    position: "65% center",
  },
  {
    title: "无畏契约",
    tag: "FPS",
    image: "valorant-iso",
    href: "https://val.qq.com/main.html",
    detail: "枪法 · 沟通 · 协同",
    position: "center",
  },
  {
    title: "三角洲行动",
    tag: "FPS",
    image: "delta",
    href: "https://df.qq.com/",
    detail: "枪法 · 沟通 · 协同",
    position: "center",
  },
  {
    title: "原神",
    tag: "OPEN WORLD",
    image: "genshin",
    href: "https://ys.mihoyo.com/",
    detail: "探索 · 养成 · 同行",
    position: "center",
  },
  {
    title: "鸣潮",
    tag: "OPEN WORLD",
    image: "wuwa",
    href: "https://mc.kurogames.com/main",
    detail: "探索 · 养成 · 同行",
    position: "center",
  },
  {
    title: "洛克王国",
    tag: "OPEN WORLD",
    image: "roco",
    href: "https://rocom.qq.com/",
    detail: "探索 · 养成 · 同行",
    position: "center",
  },
  {
    title: "三国：冰河时代",
    tag: "STRATEGY",
    image: "sanguo",
    href: "https://www.taptap.cn/app/748248",
    detail: "运营 · 布局 · 长期对抗",
    position: "65% center",
  },
];

const structureCards = [
  {
    count: "1",
    role: "总队长",
    detail: "负责带节奏、拍板大事，决定全队重大方向和管理策略。",
  },
  {
    count: "4",
    role: "分部副队",
    detail: "各游戏品类的分部负责人，既管日常，也负责稳定分部氛围。",
  },
  {
    count: "6",
    role: "领队",
    detail: "负责赛事对接、活动组织、成员联络，是真正跑在前线的人。",
  },
];

const recruitRequirements = [
  {
    title: "王者荣耀重点招募",
    detail: "当前重点建设王者荣耀分部，其他游戏分部也在持续扩编中。",
  },
  {
    title: "男选手标准",
    detail:
      "巅峰赛分数 12000+，综合评分 80+，欢迎愿意认真打、愿意磨合的选手加入。",
  },
  {
    title: "女选手标准",
    detail: "巅峰赛分数 8000+，绿色通道已开启，姐妹们冲就完了。",
  },
];

const activityHighlights = [
  "队内排位赛",
  "友谊赛",
  "1v1 单挑王争霸",
  "内战赛",
  "娱乐挑战赛",
];

function getTeamAgeYears() {
  const now = new Date();
  let years = now.getFullYear() - foundedAt.getFullYear();
  const anniversaryPassed =
    now.getMonth() > foundedAt.getMonth() ||
    (now.getMonth() === foundedAt.getMonth() &&
      now.getDate() >= foundedAt.getDate());

  if (!anniversaryPassed) {
    years -= 1;
  }

  return years;
}

function OutwardArrow() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 18 18 6M6 6h12v12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AboutPage() {
  const teamAgeYears = getTeamAgeYears();

  return (
    <div className="page-shell dq-about-page">
      <PageHero
        title="殿祁 · DQ 战队"
        description={`一支从 2020 年 4 月 19 日走到今天的综合型电竞战队。${teamAgeYears} 年沉淀、24 个赛季，留下的不只是成绩，还有一群愿意并肩打下去的队友。`}
        actions={[
          { href: "/history", label: "查看成长史", variant: "primary" },
          { href: "/members", label: "认识队友", variant: "secondary" },
        ]}
      />
      <section className="dq-about-intro" aria-label="战队名片">
        <p>
          战队全称是 <strong>殿祁</strong>，简称 <strong>DQ</strong>
          。我们不是只围着一款游戏打转的单一战队，而是一支多品类、多设备、多玩法共存的电竞社区。
        </p>
        <dl className="dq-about-facts">
          {rosterStats.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section
        className="dq-about-honor-feature"
        aria-labelledby="about-honor-title"
      >
        <div>
          <span className="ui-pill">S35 全国赛事冠军</span>
          <h2 id="about-honor-title">从区级，打到全国。</h2>
          <p>
            从 S19 一路打到 S42，整整 24 个赛季没有掉队。S35
            赛季拿下全国赛事冠军，是 DQ
            全队一起拼出来的里程碑，也让这支队伍站上了更大的舞台。
          </p>
          <p>
            不只是全国赛，在区、市、省级各类赛事里，我们一直在往上打、往前冲，靠持续磨合把队伍一步步打厚。
          </p>
          <div className="ui-actions">
            <Link href="/history" className="ui-button">
              回看成长史
              <OutwardArrow />
            </Link>
            <Link href="/achievements" className="ui-button ui-button--quiet">
              进入荣誉墙
              <OutwardArrow />
            </Link>
          </div>
        </div>
        <div className="dq-about-honor-emblem">
          <Image
            src="/images/history-badges/national.png"
            alt="全国赛事战队徽章"
            width={145}
            height={220}
            className="object-contain"
          />
          <span>S35</span>
        </div>
      </section>

      <section
        id="games"
        className="dq-about-games"
        aria-labelledby="games-title"
      >
        <div className="dq-about-section-heading">
          <div>
            <h2 id="games-title">多维度游戏版图</h2>
            <p>
              我们不只围着一款游戏转。只要你真的热爱，愿意一起打、一起玩、一起成长，这里就有你的位置。
            </p>
          </div>
          <span className="dq-about-section-note">多款游戏，同一份热爱。</span>
        </div>
        <div className="dq-about-game-grid">
          {gamePortfolio.map((item, index) => (
            <a
              key={item.image}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`dq-about-game${index === 0 ? " dq-about-game-featured" : ""}`}
              aria-label={`查看${item.title}官方页面（新窗口）`}
            >
              <Image
                src={`/images/games/${item.image}.webp`}
                alt=""
                fill
                loading={index === 0 ? "eager" : "lazy"}
                sizes={
                  index === 0
                    ? "(max-width: 600px) 100vw, (max-width: 1000px) 90vw, 600px"
                    : "(max-width: 600px) 90vw, (max-width: 1000px) 45vw, 300px"
                }
                style={{ objectPosition: item.position }}
                className="dq-about-game-image"
              />
              <div className="dq-about-game-top">
                <span>{item.tag}</span>
                {index === 0 ? (
                  <span className="dq-about-core-label">核心分部</span>
                ) : null}
              </div>
              <div className="dq-about-game-copy">
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </div>
              <span className="dq-about-game-arrow">
                <OutwardArrow />
              </span>
            </a>
          ))}
        </div>
        <p className="dq-about-media-note">
          游戏画面来自各游戏官网及官方发布页，版权归各游戏权利方所有。
        </p>
      </section>

      <div className="dq-about-people-grid">
        <section
          className="dq-about-organization"
          aria-labelledby="organization-title"
        >
          <div className="dq-about-block-heading">
            <h2 id="organization-title">精英管理架构</h2>
            <span>分工明确 · 并肩前行</span>
          </div>
          <p className="dq-about-block-description">
            我们想做的是一个有爱、能打、又不散架的大家庭。分工清楚、职责明确，是战队能一直稳定往前走的关键。
          </p>
          <ol className="dq-about-org-list">
            {structureCards.map((item) => (
              <li key={item.role} className="dq-about-org-item">
                <span className="dq-about-org-node" aria-hidden="true" />
                <div className="dq-about-org-copy">
                  <h3>{item.role}</h3>
                  <p>{item.detail}</p>
                </div>
                <span className="dq-about-org-count">
                  {item.count}
                  <span>人</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="dq-about-org-footer">
            从方向决策，到分部日常，再到赛事与成员联络。
          </p>
        </section>

        <section
          className="dq-about-recruitment"
          aria-labelledby="requirements-title"
        >
          <div className="dq-about-block-heading">
            <h2 id="requirements-title">入队标准与招募</h2>
            <span className="dq-about-recruiting">
              <i aria-hidden="true" />
              王者荣耀重点招募
            </span>
          </div>
          <p className="dq-about-block-description">
            {recruitRequirements[0].detail}
          </p>
          <div className="dq-about-requirement-table-wrap">
            <table
              className="dq-about-requirement-table"
              aria-describedby="recruitment-metric-note"
            >
              <caption className="sr-only">王者荣耀分部入队标准</caption>
              <thead>
                <tr>
                  <th scope="col">选手</th>
                  <th scope="col">入队门槛</th>
                  <th scope="col">综合评分</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">男选手</th>
                  <td>
                    12000<span>+</span>
                  </td>
                  <td>
                    80<span>+</span>
                  </td>
                </tr>
                <tr>
                  <th scope="row">女选手</th>
                  <td>
                    8000<span>+</span>
                  </td>
                  <td>
                    <span
                      className="dq-about-not-specified"
                      aria-label="未单列要求"
                    >
                      —
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="dq-about-recruit-notes">
            <p>欢迎愿意认真打、愿意磨合的选手加入。女选手绿色通道已开启。</p>
            <p id="recruitment-metric-note">
              具体标准及试训安排，以审核群通知为准。
            </p>
            <p>
              未来还会继续开放更多游戏的招募入口。如果你看重氛围、看重长期稳定，记得常来看看。
            </p>
          </div>
          <Link href="/#recruitment" className="dq-about-recruit-link">
            了解审核流程与试训安排 <OutwardArrow />
          </Link>
        </section>
      </div>

      <section className="dq-about-join-banner" aria-labelledby="join-title">
        <Image
          src="/images/recruitment-room-concept.webp"
          alt=""
          fill
          sizes="(max-width: 600px) 100vw, 1200px"
          className="dq-about-join-image"
        />
        <div className="dq-about-join-content">
          <h2 id="join-title">把热爱，打成默契。</h2>
          <p>找到你的队友，从加入 DQ 开始。</p>
          <Link href="/#recruitment" className="dq-about-join-button">
            前往战队审核群 <OutwardArrow />
          </Link>
        </div>
        <span className="dq-about-concept-caption">
          AI 生成 · 训练室概念氛围图
        </span>
      </section>

      <section className="dq-about-culture-grid">
        <div>
          <h2>一起打，也一起玩。</h2>
          <p>
            平时不只是排位和冲榜。DQ
            更像一个有固定节奏的活动场，能打比赛，也能整活，体验感要一起拉满。
          </p>
          <ul>
            {activityHighlights.map((item) => (
              <li key={item}>
                <span aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <p>
            不管你是想认真磨配合、想找稳定搭子，还是想在一个有氛围的战队里待着，DQ
            都希望把“能玩得久”这件事做出来。
          </p>
        </div>
        <div>
          <h2>能打、能聚、能长久。</h2>
          <p>
            DQ
            的核心不是只堆一时成绩，而是把战队做成能长期留下人的地方。成绩要有，氛围要有，组织也要稳，这才是我们一直想做的队伍样子。
          </p>
          <dl>
            <div>
              <dt>核心关键词</dt>
              <dd>综合型电竞战队 / 多游戏分部 / 长期陪跑成长</dd>
            </div>
            <div>
              <dt>当前主战场</dt>
              <dd>王者荣耀分部重点建设，其它分部同步拓展中</dd>
            </div>
          </dl>
          <Link href="/#recruitment" className="ui-text-link">
            找到你的位置
            <OutwardArrow />
          </Link>
        </div>
      </section>
    </div>
  );
}
