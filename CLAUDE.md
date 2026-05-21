# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Workflow Lab — experiments and prototypes for AI-native workflow automation. The goal is to explore AI-assisted engineering workflows, build reusable automation patterns, and prototype SaaS-ready workflow tools.

## Tech Stack

TypeScript · Next.js · Python · OpenAI API · Automation Tools

## 强制性工作流规则

### 设计先行原则
在编写任何代码之前，必须遵循以下流程：

1. **需求分析** → 在对应功能模块的 `/docs/` 目录下创建详细的设计文档
2. **方案审查** → 输出设计方案后，等待我审查确认
3. **审查通过后** → 方可开始编码实现

### 项目总规划文件
1. 文件目录`/docs/项目总规划.md`
2. 每次决策修改、关键设计，需要更新这个文件

### frontend aesthetics
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:
 
1. Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.
 
2. Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.
 
3. Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.
 
4. Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.
 
5. Avoid generic AI-generated aesthetics:
   - Overused font families (Inter, Roboto, Arial, system fonts)
   - Clichéd color schemes (particularly purple gradients on white backgrounds)
   - Predictable layouts and component patterns
   - Cookie-cutter design that lacks context-specific character
 
6. Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!

7. Skeleton loading states: Every page that may have performance issues (API-dependent, lazy-loaded modules, dynamic imports) MUST have a skeleton screen loading state. Use Suspense + skeleton fallback pattern. Skeleton layout must mirror real content layout to avoid CLS. Use animate-pulse with muted border color, never flashing/rotating animations. Applies to: app marketplace, individual app pages, dashboards, data tables, and any page with async data dependencies.

### 文档输出要求
每次开发任务必须按功能模块输出文档到 `/docs/{模块名}/` 目录：

| 文档 | 说明 | 文件命名 |
|------|------|---------|
| 业务逻辑文档 | 描述业务需求、流程、规则 | `业务逻辑.md` |
| 技术设计方案 | 架构设计、技术选型、接口设计 | `技术方案.md` |
| 数据模型设计 | 数据模型、表结构、关系 | `数据模型.md` |

### 执行约束
- ❌ 禁止在未输出设计方案的情况下直接编写代码
- ❌ 禁止在未获得我明确批准的情况下开始编码
- ✅ 必须先输出设计方案文档，等待我审查
- ✅ 我确认「方案通过」或「可以开始」后，才能进入编码阶段

### 提交代码规范
- commit message全部使用英文
- 不可留下Claude code的提交用户信息

## 快捷指令

当我说「保存进度」时，请执行：
1. 更新 CLAUDE.md 中的「当前进度」和「最近完成的工作」部分
2. 更新 docs/进度追踪.md
3. 列出未提交的更改

当我说「继续开发」时，请执行：
1. 运行 `bash dev-start.sh` 一键启动开发环境（Docker + 前后端）
2. 读取 CLAUDE.md 了解当前进度
3. 读取 docs/进度追踪.md
4. 读取 docs/决策记录.md
5. 读取 git log 查看最近的提交
6. 总结当前状态并建议下一步

## 当前进度

- [x] SaaS 基础框架搭建 — 整体架构已实现
- [x] 用户管理系统 — 注册/登录/JWT/个人信息 API 已实现
- [x] 权限管理系统 — RBAC 四级权限 API 已实现
- [x] **成员管理模块** — 完整增删改查 + 邀请流程 + RBAC 权限 + 邮件服务 + Token 刷新
- [x] 订阅付款系统 — 设计文档已完成，Paddle Billing 方案已定，待编码集成
- [x] 前端框架搭建 — Next.js 14 + 主题 + i18n + 响应式布局
- [x] **第一阶段前端页面** — Dashboard/Members/Settings 完整实现，前后端全链路可测试
- [x] 本地开发环境 — Docker 29.5.0 + Colima + PostgreSQL 16 + Redis 8 + MinIO
- [x] Docker 服务 — docker-compose 启动 postgres/redis/minio 容器，全部 healthy
- [x] 一键启动脚本 — `bash dev-start.sh` 自动启动 Colima + Docker + 前后端，`--stop` 停止全部
- [x] **部署上线** — Vercel + Fly.io + Supabase + Upstash，前后端全链路可访问
- [x] **应用模块** — 应用市场首页 + 详情页 + 业务页面 + 行业过滤 + Banner 轮播 + 骨架屏
- [x] **组织与行业** — 注册填写企业名称/行业级联选择 + Sidebar 企业展示 + 行业后端 API
- [x] **超级管理员** — 应用管理后台（应用/Banner CRUD）+ 下线应用拦截 + 超管中间件
- [x] **登录/注册主题语言** — 认证页面支持主题切换 + 完整中英文 i18n
- [x] **订阅付款集成** — Paddle Billing Checkout + Webhook + 付费应用拦截 + 成员上限 + 前端 Billing 页面
- [x] **阅读器应用** — 小说浏览/阅读/收藏/进度跟踪 + 6语言翻译 + Puppeteer 爬虫引擎 + 管理后台

## 最近完成的工作

- 2026-05-21: **阅读器爬虫安全修复** — 修复 Token 刷新 bug（api.ts 完整 state 被当作 user 传入导致认证状态损坏，改为传入 user/orgId 独立字段）、修复放弃小说后前端列表未移除（后端 listIncompleteNovels 改为只查 INCOMPLETE + 前端即时过滤）、操作状态反馈（toast 组件 + Framer Motion 动画 + 3s 自动消失）、爬虫仅采集免费已完结小说（纵横/起点书库 URL 更新 + fetchNovelInfo 检测 isCompleted/isFree 字段 + VIP 章节检测 __VIP__ 标记 + manager 层跳过不符合条件的小说）
- 2026-05-21: **阅读器应用完整实现** — 阅读器前后端全链路开发，包含 7 大功能模块：i18n 完整中英文支持（40+ key）、组件拆分（page.tsx 637行→84行路由+5个子组件+hook）、阅读进度保存（2s防抖滚动跟踪+继续阅读卡片+详情页继续按钮）、收藏快速入口（全部/收藏切换+后端字段对齐）、章节目录抽屉（Framer Motion 滑出+自动滚动定位+点击跳转）、阅读界面固定UI（顶栏 sticky+底栏浮动+safe-area适配）、全文翻译模式（6语言选择+段落分割+批量API+结果缓存+loading状态）。爬虫引擎：Puppeteer 采集起点/纵横中文网、断点续爬、优雅停止、实时状态监控、去重检查。翻译服务：支持 OpenAI/DeepL/Custom 多引擎。管理后台：小说/章节/横幅/翻译配置 CRUD + 爬虫控制面板
- 2026-05-20: **Paddle Billing 集成** — Paddle SDK 封装（checkout/订阅管理/Webhook 验证）、订阅模块（套餐查询/Checkout 创建/取消/付款记录）、Webhook 处理（订阅激活/更新/取消/支付完成/支付失败）、付费应用守卫中间件（实时检查订阅状态+7天试用期）、成员上限中间件（Free=3/Pro=员工数/Enterprise=无限）、前端 Billing 页面（套餐卡片+人数输入+实时计价+支付记录表）、应用市场付费标识、超管 isPaid 编辑、IndustryMultiSelect 多行业选择组件、成员上限接入邀请/注册/接受邀请流程
- 2026-05-19: **Bug 修复与 UI 优化** — 超管登录无应用管理菜单/成员页无限加载、应用市场未反映管理后台编辑、Sidebar 图标替换为 lucide-react、收起状态悬浮气泡提示、hydration 服务端/客户端不匹配、Sidebar 横向滚动条、深色模式左侧白边、收起按钮深浅色主题背景适配、骨架屏加载规范
- 2026-05-19: **应用模块完整实现** — 市场首页（Banner 轮播/精选/行业过滤/骨架屏）、应用详情页（模块列表）、业务页面动态路由
- 2026-05-19: **超级管理员模块** — 超管中间件 + 应用管理后台（应用/Banner 表格 CRUD）+ 下线拦截 + admin@saas.com 超管账号
- 2026-05-19: **组织与行业** — 注册增加企业名称（必填）+ 3 级行业级联选择（15 个 L1 行业）+ 后端静态 API + 侧边栏企业首字符 Logo
- 2026-05-19: **Sidebar 优化** — 展开/收起功能（持久化）+ 打开应用页自动收起 + 超管显示应用管理菜单
- 2026-05-19: **主题/语言适配** — 认证页面主题切换 + 全部表单占位符/文案中英文 i18n + CSS 变量暗亮色适配
- 2026-05-19: 种子数据更新 — 8 个示例应用（CRM/HR/PM/E-commerce/教育/医疗/FinTech）+ 3 个 Banner + 超管账号
- 2026-05-19: **首次部署上线** — 后端 Fly.io + 前端 Vercel + Supabase Tokyo + Upstash，全链路可访问
- 2026-05-18: 部署方案设计与配置 — Vercel+Fly.io+Supabase+Upstash+Cloudflare R2 全部免费方案
- 2026-05-18: 成员管理模块完整开发 — 邀请流程、RBAC 权限中间件、邮件服务(Resend)、Token 刷新拦截器、注册邀请支持、角色权限 UI 控制

## 下一步计划

1. 端到端测试阅读器全流程（浏览→阅读→翻译→收藏→进度）
2. 爬虫稳定性测试（长时间运行、断点续爬验证）
3. 注册 Paddle 账号，配置 Sandbox Products/Prices，填入 seed 数据
4. 端到端测试 Paddle Checkout + Webhook 完整流程
5. 实现 OAuth 第三方登录（Google / GitHub）
6. 后端 API 集成测试 + 前端 E2E 测试
7. 绑定自定义域名

## 关键决策记录

| 日期 | 决策 | 理由 |
|------|------|------|
| 2026-05-17 | 后端选 Express 而非 Nest.js | 学习成本低，对 Node 开发者更友好 |
| 2026-05-17 | 前端用自研 i18n Hook 替代 next-intl | next-intl v3 配置复杂，自定义方案更可控 |
| 2026-05-17 | 前端深色主题 ink+amber 配色 | 避免 AI slop，创造独特视觉识别 |
| 2026-05-17 | 字体选 DM Serif Display + DM Sans + JetBrains Mono | 避免 Inter/Roboto 等通用字体 |
| 2026-05-17 | 用 Colima + 本地安装替代 Docker Desktop | Docker Desktop 下载源 DNS 无法解析；Colima 二进制可直装，PostgreSQL/Redis 直接 brew 安装更稳定 |
| 2026-05-17 | 废弃 Stripe，改用 Paddle Billing | Paddle 原生支持微信支付/支付宝，作为 MoR 承担全球税务合规，网络可达性好 |
| 2026-05-18 | 成员管理用 Invitation Token 邀请流程 | 不直接添加用户，通过生成邀请 Token → 发邮件 → 注册时自动加入组织，支持过期/取消/重复检查 |
| 2026-05-18 | 前端 Token 刷新用 401 拦截器模式 | 对业务层透明，`isRefreshing` + 等待队列防止并发刷新，实现与后端 Refresh Token Rotation 配合 |
| 2026-05-18 | 邮件服务选 Resend SDK | 现代 API 设计，React Email 生态兼容，开发环境无 API Key 时 console.warn 降级不阻塞 |
| 2026-05-18 | RBAC `manage` 权限应包含所有子操作 | 修改 permission 中间件为 `action: { in: [action, 'manage'] }`，Owner 只需分配 manage 即可 |
| 2026-05-18 | 前端选 Vercel 而非 Cloudflare Pages | Next.js 原生支持，ISR/SSR 无兼容问题，零配置 |
| 2026-05-18 | 后端选 Fly.io 而非 Render | 多区域部署（含 Tokyo），全球低延迟，无冷启动 |
| 2026-05-18 | 数据库选 Supabase 托管而非自建 | 免费 500MB，免运维，内置连接池，每日备份 |
| 2026-05-18 | 对象存储用 Cloudflare R2 替代 MinIO | 免费 10GB 且零出口费，S3 API 兼容，无需自建 |
| 2026-05-19 | Dockerfile 用 `shamefully-hoist=true` | pnpm 默认不提升依赖到根 node_modules，生产环境 Node require 找不到 express 等模块 |
| 2026-05-19 | 用 `node:22-alpine` + `openssl` 而非 `node:20-alpine` | 最新 pnpm 需要 Node 22；Prisma 引擎需要 OpenSSL |
| 2026-05-19 | Fly.io 用 `--local-only` 构建 | 远程构建需上传 121MB context，本地构建只推最终镜像 270MB，速度快很多 |
| 2026-05-20 | 付费访问用中间件实时检查而非缓存 | 订阅状态变动（Webhook 更新 DB）需立即对所有用户生效，paidAppGuard 每次请求查 DB |
| 2026-05-20 | 套餐不限制应用数量，仅限制成员数 | 所有套餐可访问全部符合规则的应用，差异在 AI 用量（后续迭代）；成员上限 Free=3 / Pro=员工数 / Enterprise=不限 |
| 2026-05-20 | 应用支持多行业归属 | 每个应用可关联多个行业（IndustryMultiSelect 组件），企业命中任意一个即可访问 |
| 2026-05-21 | 爬虫仅采集免费+已完结小说 | 避免 VIP 付费章节爬取不完整内容；通过书库 URL 参数过滤 + 详情页检测 isCompleted/isFree + 章节内容 __VIP__ 标记三级防护 |
| 2026-05-21 | 阅读器前端拆分为 page.tsx + hook + 5 个功能组件 | 637 行单文件难以维护，拆分为职责单一的组件通过 props 通信 |
| 2026-05-21 | 翻译用批量 API + 顺序执行 + 200ms 间隔 | 防止 API 限流，前端按段落分割确保每条 ≤3000 字符 |
| 2026-05-21 | 爬虫用 Puppeteer + 单例调度器 + INCOMPLETE 续爬 | Puppeteer 可绕过反爬；单例管理浏览器实例避免资源浪费；断点续爬通过 status 字段实现 |
| 2026-05-21 | resumeNovel 改为 INCOMPLETE 而非 RUNNING | 爬虫只在启动时查询 INCOMPLETE 小说进行恢复，设为 RUNNING 永远不会被拾取 |

## 项目文档索引

- `/docs/项目总规划.md` — 项目整体规划
- `/docs/进度追踪.md` — 开发进度追踪
- `/docs/决策记录.md` — 技术决策记录
- `/docs/用户管理/` — 用户注册/登录/个人信息模块文档
- `/docs/权限管理/` — 组织/角色/应用/模块权限文档
- `/docs/订阅付款/` — 订阅计划/支付收款文档
- `/docs/前端框架/` — UI框架/响应式/主题/多语言文档
- `/docs/部署运维/` — 前后端部署/CI/CD文档
- `/docs/阅读器/` — 小说阅读器业务逻辑/技术方案/数据模型
- `/docs/应用/` — 应用市场/应用管理文档
- `/docs/应用模块/` — 应用模块架构文档
- `/docs/组织与行业/` — 组织管理/行业分类文档

## Roadmap

- Basic workflow runner
- Prompt template manager
- AI task execution demo
- Web dashboard
- Deployment guide
