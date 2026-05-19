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
- [ ] 订阅付款集成 — Paddle Checkout + Webhook + 升级降级

## 最近完成的工作

- 2026-05-19: **首次部署上线** — 后端 Fly.io (saas-platform-api-kind-fire-7734.fly.dev) + 前端 Vercel (ai-workflow-lab-web.vercel.app) + Supabase Tokyo + Upstash，全链路可访问
- 2026-05-19: 种子数据导入 — Supabase 数据库迁移 + 测试用户/角色/权限种子数据
- 2026-05-19: Dockerfile 踩坑修复 — node:22-alpine / OpenSSL / shamefully-hoist / prisma 权限 / 密码编码
- 2026-05-18: 部署方案设计与配置 — Vercel+Fly.io+Supabase+Upstash+Cloudflare R2 全部免费方案
- 2026-05-18: 修复生产构建 — tsconfig noEmit 移除 + @prisma/client 移入 dependencies + shared 包编译
- 2026-05-18: 成员管理模块完整开发 — 邀请流程、RBAC 权限中间件、邮件服务(Resend)、Token 刷新拦截器、注册邀请支持、角色权限 UI 控制
- 2026-05-18: 一键启动脚本 `dev-start.sh` — 自动启动 Colima + Docker + 前后端，支持 `--stop` 停止全部
- 2026-05-17: 第一阶段前端页面完成 — Dashboard/Members/Settings 全链路可测试
- 2026-05-17: 响应式布局 — 移动端 Sidebar drawer + 汉堡菜单 + 遮罩动画
- 2026-05-17: Header 接入 Dashboard 布局 — 主题切换/语言切换/用户菜单
- 2026-05-17: API Client 自动注入 JWT Token — 无需手动传 token
- 2026-05-17: Auth Guard 路由保护 — 未登录自动跳转登录页
- 2026-05-17: 环境验证通过 — Docker + Colima + PostgreSQL + Redis + MinIO 全部 running healthy

## 下一步计划

1. 实现 Paddle Billing 订阅支付（Checkout + Webhook + 升级降级）
2. 实现 OAuth 第三方登录（Google / GitHub）
3. 后端 API 集成测试 + 前端 E2E 测试
4. 绑定自定义域名

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

## 项目文档索引

- `/docs/项目总规划.md` — 项目整体规划
- `/docs/进度追踪.md` — 开发进度追踪
- `/docs/决策记录.md` — 技术决策记录
- `/docs/用户管理/` — 用户注册/登录/个人信息模块文档
- `/docs/权限管理/` — 组织/角色/应用/模块权限文档
- `/docs/订阅付款/` — 订阅计划/支付收款文档
- `/docs/前端框架/` — UI框架/响应式/主题/多语言文档
- `/docs/部署运维/` — 前后端部署/CI/CD文档

## Roadmap

- Basic workflow runner
- Prompt template manager
- AI task execution demo
- Web dashboard
- Deployment guide
