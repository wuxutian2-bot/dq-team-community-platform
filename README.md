# DQ 殿祁战队 · 成长记录与成员社区

一个基于 Next.js + Supabase 的战队社区平台，包含战队介绍、成员展示、成长史、荣誉墙、社区帖子，以及成员个人中心与管理后台。

## 在线访问

**正式网站已部署上线：<https://dqzz2020.xyz>**，直接打开即可使用，无需任何安装。

以下「快速开始 / 生产部署」章节仅面向想获取源码、自行搭建一套的开发者。

## 功能

- **首页 / 战队介绍**：战队分部展示（王者荣耀、无畏契约、三角洲行动、原神、鸣潮、洛克王国、三国：冰河时代）、精英管理架构、入队标准与招募
- **成员展示**：成员卡片、默认头像分配
- **成长史 / 荣誉墙**：战队大事记与荣誉记录
- **社区帖子**：成员发帖互动
- **登录 / 个人中心**：基于 Supabase Auth 的账号体系，资料与密码管理
- **管理后台**：成员管理、批量 Excel 导入、内容管理（需服务端密钥）

## 技术栈

- [Next.js 16](https://nextjs.org)（App Router，`output: standalone`）
- React 19 / TypeScript 5
- Tailwind CSS 4
- [Supabase](https://supabase.com)（Postgres + Auth + Storage，RLS 行级安全）

## 快速开始（本地开发，非线上站点）

要求 Node.js 20+。

```bash
npm ci
cp .env.example .env.local   # 填入你自己的 Supabase 项目密钥
npm run dev
```

然后在浏览器打开 <http://localhost:3000> 预览你本地运行的开发副本（正式网站请直接访问 <https://dqzz2020.xyz>）。

### 环境变量

| 变量 | 说明 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目地址 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 公开客户端密钥（anon/publishable） |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端密钥，**严禁公开或提交到仓库** |
| `NEXT_PUBLIC_SITE_URL` | 站点正式域名 |

### 数据库

数据库结构与 RLS 策略见 [`supabase/migrations`](supabase/migrations)，按文件名时间顺序在新的 Supabase 项目中执行即可。

## 生产部署

```bash
npm ci
npm run build
npm run start        # 或 pm2 start npm --name dq-team -- run start
```

也可用 standalone 产物启动：`node .next/standalone/server.js`（需先复制 `.next/static` 与 `public` 到 standalone 目录）。图片上传上限 5MB，反向代理请求体限制需 ≥ 6MB。详见 [部署说明.txt](部署说明.txt)。

## 版权说明

游戏画面来自各游戏官网及官方发布页，版权归各游戏权利方所有。