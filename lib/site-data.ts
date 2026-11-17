export const publicNavigation = [
  { href: "/", label: "首页", description: "战队首页与阶段总览" },
  { href: "/about", label: "战队介绍", description: "定位、文化、组织结构" },
  { href: "/members", label: "成员展示", description: "成员卡片与详情页" },
  { href: "/history", label: "成长史", description: "时间线式发展记录" },
  { href: "/achievements", label: "荣誉墙", description: "奖项、里程碑与高光时刻" },
  { href: "/posts", label: "社区帖子", description: "内容流、互动与详情阅读" },
  { href: "/profile", label: "个人中心", description: "成员资料与动态中心" },
  { href: "/login", label: "登录", description: "成员登录与身份进入" },
];

export const adminNavigation = [
  { href: "/admin", label: "后台首页", description: "管理总览面板" },
  { href: "/admin/users", label: "成员管理", description: "成员账号与状态管理" },
  { href: "/admin/posts", label: "帖子管理", description: "帖子审阅与分类调整" },
  { href: "/admin/comments", label: "评论管理", description: "评论巡检与处理" },
  { href: "/admin/history", label: "成长史管理", description: "时间线内容维护" },
  { href: "/admin/achievements", label: "荣誉墙管理", description: "荣誉内容更新" },
  {
    href: "/admin/announcements",
    label: "公告管理",
    description: "首页公告与社区通知",
  },
  { href: "/admin/settings", label: "网站设置", description: "站点基础配置" },
];

export const permissionTiers = [
  {
    level: 1,
    name: "队长 / 超级管理员",
    focus: "最高权限",
    description:
      "拥有全站控制权，可管理成员、内容、公告、成长史、荣誉墙及角色权限设置。",
  },
  {
    level: 2,
    name: "副队 / 副管理员",
    focus: "内容统筹",
    description:
      "负责帖子、评论、公告、成长史、荣誉墙与成员基础维护，但不能变更权限等级。",
  },
  {
    level: 3,
    name: "正式成员",
    focus: "社区参与",
    description:
      "可编辑自己的资料，发布帖子，管理自己的帖子，发表评论并参与点赞互动。",
  },
  {
    level: 4,
    name: "游客",
    focus: "公开浏览",
    description: "只能访问公开内容，无法登录后进行发布、评论、点赞或管理操作。",
  },
];

export const memberSpotlights = [
  {
    id: "captain-zero",
    name: "Zero",
    role: "队长 / 战术总控",
    tagline: "负责团队方向、人员协调与关键战术拍板。",
    level: "Level 1",
    specialty: "指挥 / 赛训安排 / 社区秩序",
  },
  {
    id: "vice-blaze",
    name: "Blaze",
    role: "副队 / 内容统筹",
    tagline: "兼顾赛务推进与社区内容维护，是队伍的推进引擎。",
    level: "Level 2",
    specialty: "活动策划 / 训练复盘 / 公告管理",
  },
  {
    id: "striker-lin",
    name: "Lin",
    role: "正式成员 / 主力突击",
    tagline: "负责高压战局中的前排突破和团战切入。",
    level: "Level 3",
    specialty: "主攻 / 排位冲分 / 实战笔记",
  },
  {
    id: "scout-echo",
    name: "Echo",
    role: "正式成员 / 情报位",
    tagline: "偏好细节运营与信息整合，是队伍的视野与节奏保障。",
    level: "Level 3",
    specialty: "侦查 / 录像整理 / 攻略分享",
  },
];

export const historyMoments = [
  {
    year: "2023",
    summary: "战队组建，明确训练节奏、社群规范与内容共建目标。",
  },
  {
    year: "2024",
    summary: "完成第一次赛季冲榜与公开招募，成员结构初步稳定。",
  },
  {
    year: "2025",
    summary: "形成固定活动、成长史沉淀与荣誉墙机制，开始搭建独立官网。",
  },
  {
    year: "2026",
    summary: "进入社区平台阶段，规划成员资料、帖子互动、后台与权限系统。",
  },
];

export const achievementShowcase = [
  {
    year: "2024",
    title: "赛季冲榜突破",
    description: "战队核心成员在赛季末完成关键段位突破，建立第一批主力阵容。",
  },
  {
    year: "2025",
    title: "公开活动周最佳组织",
    description: "团队连续策划社区活动，形成稳定的外部曝光与成员活跃机制。",
  },
  {
    year: "2026",
    title: "官网与社区立项",
    description: "正式启动 DQ 战队成长记录与成员社区平台，为公网运营做准备。",
  },
];

export const featuredPosts = [
  {
    id: "night-shift-training",
    category: "训练复盘",
    title: "夜训后的节奏优化：我们这周到底修正了什么",
    excerpt: "从开团时机、支援路径到语音协同，记录一次真正有效的团队复盘。",
    author: "Blaze",
  },
  {
    id: "new-member-briefing",
    category: "新人引导",
    title: "新成员入队前需要知道的五件事",
    excerpt: "介绍战队纪律、训练安排、发帖规范和社区参与方式。",
    author: "Zero",
  },
  {
    id: "clip-room-highlights",
    category: "高光剪辑",
    title: "本周高光合集：从残局处理到正面突破",
    excerpt: "收集本周最有代表性的几场对局，作为成员展示页和荣誉墙素材储备。",
    author: "Echo",
  },
];

export const adminMetrics = [
  { label: "待审核帖子", value: "08" },
  { label: "待处理评论", value: "13" },
  { label: "本周公告", value: "02" },
  { label: "活跃成员", value: "24" },
];
