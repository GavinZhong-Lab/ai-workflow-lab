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
1. 更新生产环境数据库更新脚本，部署后直接生效
2. 更新 docs/进度追踪.md
3. 更新对应业务模块的业务、模型、技术文档
4. 中文列出未提交的更改，英文编写commit message并提交代码

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
- [x] 成员管理模块 — 完整增删改查 + 邀请流程 + RBAC 权限 + 邮件服务 + Token 刷新
- [x] 订阅付款系统 — Paddle Billing 集成（Checkout/Webhook/付费拦截/成员上限）
- [x] 前端框架搭建 — Next.js 14 + 主题 + i18n + 响应式布局
- [x] 第一阶段前端页面 — Dashboard/Members/Settings 完整实现
- [x] 本地开发环境 — Docker + Colima + PostgreSQL + Redis + MinIO
- [x] 一键启动脚本 — `bash dev-start.sh` 自动启动/停止全部服务
- [x] 部署上线 — Vercel + Fly.io + Supabase + Upstash
- [x] 应用模块 — 应用市场 + 详情页 + 业务页面 + 行业过滤 + Banner + 骨架屏
- [x] 组织与行业 — 注册企业名称/行业级联 + Sidebar 企业展示
- [x] 超级管理员 — 应用管理后台（CRUD）+ 下线拦截 + 超管中间件
- [x] 登录/注册主题语言 — 认证页面主题切换 + 完整中英文 i18n
- [x] 订阅付款集成 — Paddle Billing Checkout + Webhook + 付费拦截 + 成员上限 + Billing 页面
- [x] 阅读器应用 — 小说浏览/阅读/收藏/进度跟踪 + 全局翻译（Zustand + 6语言）+ Puppeteer 爬虫 + 管理后台

## 下一步计划

1. 端到端测试阅读器全流程（浏览→阅读→全局翻译→收藏→进度）
2. 爬虫稳定性测试（长时间运行、断点续爬验证）
3. 注册 Paddle 账号，配置 Sandbox Products/Prices，填入 seed 数据
4. 端到端测试 Paddle Checkout + Webhook 完整流程
5. 实现 OAuth 第三方登录（Google / GitHub）
6. 后端 API 集成测试 + 前端 E2E 测试
7. 绑定自定义域名

## 关键决策记录

| 日期 | 决策 | 理由 |
|------|------|------|
| 2026-05-17 | 前端深色主题 ink+amber 配色 | 避免 AI slop，创造独特视觉识别 |
| 2026-05-17 | 字体选 DM Serif Display + DM Sans + JetBrains Mono | 避免 Inter/Roboto 等通用字体 |
| 2026-05-18 | 前端 Token 刷新用 401 拦截器模式 | 对业务层透明，`isRefreshing` + 等待队列防止并发刷新 |
| 2026-05-18 | RBAC `manage` 权限应包含所有子操作 | Owner 只需分配 manage 即可覆盖所有子操作 |
| 2026-05-20 | 付费访问用中间件实时检查而非缓存 | 订阅状态变动需立即生效，每次请求查 DB |
| 2026-05-20 | 套餐不限制应用数量，仅限制成员数 | 所有套餐可访问全部应用，差异在 AI 用量（后续迭代） |
| 2026-05-20 | 应用支持多行业归属 | 每个应用可关联多个行业，企业命中任意一个即可访问 |
| 2026-05-21 | 爬虫仅采集免费+已完结小说 | 三级防护：URL 过滤 + 详情页检测 + 章节 __VIP__ 标记 |
| 2026-05-21 | 阅读器前端拆分为 page.tsx + hook + 5 个功能组件 | 637 行单文件难以维护，拆分为职责单一的组件 |
| 2026-05-21 | 翻译用批量 API + 顺序执行 + 200ms 间隔 | 防止 API 限流，每条 ≤3000 字符 |
| 2026-05-22 | 翻译状态用 Zustand 全局管理 + 内容寻址缓存 | 同文共享翻译结果，跨视图复用，语言偏好持久化 |
| 2026-05-22 | Node.js fetch 用 EnvHttpProxyAgent | 原生 fetch 不读 HTTP_PROXY 环境变量，undici ProxyAgent 自动适配代理 |

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
