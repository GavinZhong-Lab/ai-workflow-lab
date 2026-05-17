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
1. 读取 CLAUDE.md 了解当前进度
2. 读取 docs/进度追踪.md
3. 读取 docs/决策记录.md
4. 读取 git log 查看最近的提交
5. 总结当前状态并建议下一步

## 当前进度

- [x] SaaS 基础框架搭建 — 整体架构已实现
- [x] 用户管理系统 — 注册/登录/JWT/个人信息 API 已实现
- [x] 权限管理系统 — RBAC 四级权限 API 已实现
- [ ] 订阅付款系统 — 数据模型已建，Stripe 集成待实现
- [x] 前端框架搭建 — Next.js 14 + 主题 + i18n + 响应式布局
- [ ] 部署运维 — Docker Compose 已配置，CI/CD 待实现

## 最近完成的工作

- 2026-05-17: 完成 monorepo 项目搭建（pnpm + Turborepo）
- 2026-05-17: 完成后端 API 全部模块（auth/user/organization/permission）
- 2026-05-17: 完成 Prisma Schema 设计 + 种子数据脚本
- 2026-05-17: 完成前端框架搭建（Next.js 14 + TailwindCSS + Framer Motion）
- 2026-05-17: 完成登录/注册/Dashboard 页面 + 深色主题 UI
- 2026-05-17: 修复全部 TypeScript 类型错误，前后端 tsc 零错误
- 2026-05-17: 前后端服务器启动验证通过（localhost:3000 / localhost:4000）

## 下一步计划

1. 集成 Stripe 支付，实现订阅/付款完整流程
2. 实现 OAuth 第三方登录（Google / GitHub）
3. 后端 API 集成测试 + 前端 E2E 测试
4. 前端 Dashboard/Members/Billing 页面完整功能实现
5. CI/CD 部署方案实施

## 关键决策记录

| 日期 | 决策 | 理由 |
|------|------|------|
| 2026-05-17 | 后端选 Express 而非 Nest.js | 学习成本低，对 Node 开发者更友好 |
| 2026-05-17 | 前端用自研 i18n Hook 替代 next-intl | next-intl v3 配置复杂，自定义方案更可控 |
| 2026-05-17 | 前端深色主题 ink+amber 配色 | 避免 AI slop，创造独特视觉识别 |
| 2026-05-17 | 字体选 DM Serif Display + DM Sans + JetBrains Mono | 避免 Inter/Roboto 等通用字体 |

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
