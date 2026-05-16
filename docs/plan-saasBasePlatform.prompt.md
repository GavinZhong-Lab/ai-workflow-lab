# SaaS 基础框架 - 完整规划文档

## 项目概述

轻量级 AI-native SaaS 平台基础框架，为一人开发者快速构建多组织、多用户的智能化 SaaS 应用。

**核心定位：** AI 作为平台的"一等公民"，可在全局任意位置唤起，在用户权限范围内深度介入任何 SaaS 业务流程——自动化分析、流程执行、数据收集、行为学习等。

**核心目标（MVP 版本）：**

- ✅ 用户管理、登陆/注册、邮箱验证
- ✅ 组织创建、成员邀请、简化权限管理（3 个预设角色）
- ✅ 前后端分离部署，后端 API 可供后续应用接入
- ✅ 前端支持 PC、移动端响应式布局、深色模式
- ✅ 用户行为追踪，为 AI 行为学习打基础
- ⏳ 后期扩展：AI Agent 智能层、工作流引擎、审计日志、多语言、订阅支付

**开发周期：**

- **Phase 1（8 周）：** SaaS 基础框架上线，架构预留 AI 接口
- **Phase 2（第 9-12 周）：** AI Agent 智能层上线
- **Phase 3（第 13+ 周）：** 商业化功能

---

## 核心业务模块

### 1. 用户管理模块

**功能：**

- 用户注册 / 登录 / 登出
- 个人信息管理（头像、昵称、邮箱等）
- 密码重置 / 修改
- 邮箱验证
- 第三方登录（可选：Google、GitHub、微信等）

**业务流程：**

```
注册 → 邮箱验证 → 登录 → 创建组织 → 进入应用
```

### 2. 组织/团队管理模块

**功能：**

- 用户创建组织
- 邀请成员加入组织
- 组织成员管理（添加、删除、角色分配）
- 组织基本信息管理（名称、logo、描述等）

**核心概念：**

- **组织（Organization）** - 独立的业务单位，数据隔离边界
- **成员（Member）** - 属于某个组织的用户
- 一个用户可以属于多个组织

### 3. 权限管理模块（简化版）

**简化的权限架构：** `用户 → 组织 → 角色 → 权限` （3 层级）

#### 3.1 预置角色（MVP 只有 3 个）

- **Admin（组织管理员）**：完全权限（创建成员、删除成员、管理设置等）
- **Member（普通成员）**：读写权限（查看、创建、编辑自己的内容）
- **Guest（访客）**：只读权限（仅查看内容）

#### 3.2 权限模型（简化）

```
用户：张三
├─ 组织：ABC公司
│  ├─ 角色：Admin
│  └─ 权限：
│     ├─ 创建成员
│     ├─ 删除成员
│     ├─ 管理设置
│     ├─ 查看所有数据
│     └─ 编辑所有数据
```

#### 3.3 权限检查流程（简化）

```
请求进来
  ↓
验证 JWT Token
  ↓
获取用户在该组织的角色
  ↓
判断角色的权限
  ↓
允许 / 拒绝请求
```

**后期扩展计划（Phase 2）：**

- 应用/模块级权限
- 资源级权限（如部门、项目数据权限）
- 自定义角色支持

### 4. AI Agent 智能层（Phase 1 预留，Phase 2 实现）

**核心设计理念：** AI 不是附属于某个模块的聊天机器人，而是贯穿平台的智能基础设施。任何 SaaS 模块（如未来接入的 CRM、项目管理等）都可以被 AI 在用户权限范围内操作。

#### 4.1 AI 交互方式

- **全局 AI 对话面板**（类似 Copilot）——侧边栏/浮窗随时唤起
- 用户用自然语言下达任务，AI 自动理解并调用系统 API 执行
- 支持流式对话（WebSocket/SSE）

#### 4.2 AI 上下文（深度上下文）

AI 唤起时自动获取以下上下文：

- 当前页面/模块上下文（如 CRM 客户页则知道客户 ID）
- 当前用户角色与权限
- 用户近期操作历史
- 用户偏好设置
- 组织内相关数据
- 相似用户的行为模式（匿名化）

#### 4.3 分级确认机制

| 级别 | 说明 | 示例 |
|------|------|------|
| **AUTO** | 自动执行，不通知 | 数据查询、统计分析 |
| **NOTIFY** | 自动执行，完成后通知 | 生成报告、数据导出 |
| **CONFIRM** | 需要用户点击确认 | 发送邮件、修改数据 |
| **REAUTH** | 需要重新验证身份 | 删除数据、权限变更 |

#### 4.4 AI 工具注册（Tool Registry）

每个业务模块通过装饰器将 API 注册为 AI 可调用的工具：

```typescript
@AITool({
  name: 'send_email',
  description: '发送邮件给指定用户',
  riskLevel: 'high',        // 决定确认级别
  category: 'notification',
  module: 'crm',
  permission: 'send_email', // AI 按用户权限过滤
})
async sendEmail(to: string, subject: string, body: string) { ... }
```

#### 4.5 AI 能力范围

```
┌──────────────────────────────────────────────────────┐
│                    AI Agent 层                        │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌───────────┐  │
│  │ 行为学习 │ │ 流程执行  │ │ 数据分析│ │ 主动通知  │  │
│  └─────────┘ └──────────┘ └────────┘ └───────────┘  │
│                                                      │
│  • 在用户权限范围内执行操作                           │
│  • 自动记录和学习用户操作行为、决策偏好               │
│  • 发现可自动化的重复流程并建议/执行                  │
│  • 跨组织知识复用（匿名化最佳实践推荐）               │
│  • 工作流自动化编排                                   │
└──────────────────────────────────────────────────────┘
```

**场景示例（CRM 模块接入后）：**

- 用户在客户详情页唤起 AI："分析这个客户的沟通记录，总结关键需求"
- AI 读取沟通记录 → 提取关键信息 → 生成摘要和跟进建议
- 用户："给这个客户发一封跟进邮件"
- AI 基于上下文草拟邮件 → 弹出确认 → 用户确认 → 发送
- 后台：AI 学习到该用户每周末会分析新客户，自动在周五生成周报草稿

### 5. 行为追踪模块（Phase 1 实现）

**目的：** 为 AI 行为学习积累数据基础。

**记录内容：**

- 用户操作行为（API 调用、页面访问、功能使用）
- 操作上下文（参数、结果、时间）
- 决策数据（角色变更、成员管理、设置修改）

**实现方式：** NestJS Interceptor 自动拦截所有 API 请求，写入 `user_behaviors` 表。

### 6. 订阅 / 付款管理模块

**MVP 版本：** 暂不实现，初期以免费模式上线

**后期计划（Phase 3）：**

- 产品套餐定义（免费版、专业版等）
- 支付集成（Stripe 或支付宝）
- 订阅续费管理

### 7. 审计日志模块

**MVP 版本：** 暂不实现

**后期计划（Phase 2-3）：**

- 记录关键操作日志（成员邀请、角色变更、组织设置变更、AI 操作）
- 组织管理员可查看和导出审计日志

---

## 系统架构

### 整体架构图（MVP + AI 预留）

```
┌──────────────────────────────────────────────────────────────┐
│                    前端 (React + Vite)                        │
│  ┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │  认证   │ │ 组织管理  │ │  权限    │ │  AI 对话面板     │  │
│  │  页面   │ │  页面    │ │  页面    │ │  (Phase 2 激活)  │  │
│  └────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
│                      │                                        │
│          ┌───────────┴───────────┐                            │
│          │  行为追踪 SDK (前端)  │ ← Phase 1 实现              │
│          └───────────────────────┘                            │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP + WebSocket (Phase 2)
┌──────────────────────▼───────────────────────────────────────┐
│                  NestJS 后端 API                              │
│                                                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐  │
│  │  Auth Module  │ │  Org Module  │ │ Permission Module   │  │
│  └──────────────┘ └──────────────┘ └──────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │      AI Agent Module (Phase 1 预留, Phase 2 实现)     │    │
│  │  ┌───────────┐ ┌──────────────┐ ┌────────────────┐   │    │
│  │  │ToolRegistry│ │ContextBuilder│ │ConfirmationSvc │   │    │
│  │  └───────────┘ └──────────────┘ └────────────────┘   │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │   Behavior Interceptor (Phase 1 实现)                 │    │
│  │   自动拦截所有 API 操作 → 写入 user_behaviors 表      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │   Workflow Engine (Phase 1 预留, Phase 2 实现)        │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────┬───────────────────────────────────────┘
                       │
              ┌────────┴────────┐
     ┌────────▼──────┐  ┌──────▼──────┐
     │  PostgreSQL   │  │   Redis     │
     │  (主数据+行为)│  │  (Phase 2)  │
     └───────────────┘  └─────────────┘
```

### 部署架构

```
Vercel (前端)
    ↓
Railway (后端 Node.js)
    ↓
Supabase (PostgreSQL + 存储)
```

都提供免费层和一键部署，适合 MVP 阶段。

---

## 核心数据模型

### Phase 1（7 张表）

#### 1. users 用户表

```
id | email | username | password_hash | first_name | last_name | avatar_url
phone | is_email_verified | is_active | created_at | updated_at | deleted_at
```

#### 2. organizations 组织表

```
id | name | slug | logo_url | description | website | owner_id | is_active
created_at | updated_at | deleted_at
```

#### 3. organization_members 组织成员表

```
id | organization_id | user_id | role_id | status (invited/active) | invited_at | joined_at
created_at | updated_at
Unique(organization_id, user_id)
```

#### 4. roles 角色表

```
id | organization_id | name (Admin/Member/Guest) | description
created_at | updated_at
```

#### 5. permissions 权限表

```
id | name (create_member/delete_member/edit_org_settings/view_members/invite_members)
description | created_at
```

#### 6. role_permissions 权限关联表

```
id | role_id | permission_id | created_at
Unique(role_id, permission_id)
```

#### 7. user_behaviors 用户行为表 [新增 - Phase 1]

```
id | user_id | organization_id | action_type | page_url | context (JSONB)
metadata (JSONB) | ip_address | created_at

Index: (user_id, organization_id, created_at)
Index: (organization_id, action_type)
```

记录所有用户操作，为 AI 行为学习和模式分析提供数据基础。

#### 8. user_preferences 用户偏好表 [新增 - Phase 1]

```
id | user_id | organization_id | key | value (JSONB) | updated_at

Unique(user_id, organization_id, key)
```

存储用户个性化设置和 AI 学习到的偏好。

### Phase 2（新增 5 张表）

#### 9. ai_conversations AI 对话会话表

```
id | user_id | organization_id | title | messages (JSONB)
context_snapshot (JSONB) | created_at | updated_at
```

#### 10. ai_operation_logs AI 操作审计表

```
id | conversation_id | user_id | organization_id | tool_name
parameters (JSONB) | result (JSONB) | risk_level
confirmation_status | executed_at
```

#### 11. ai_workflows AI 工作流表

```
id | user_id | organization_id | name | description
trigger_type (event/schedule) | trigger_config (JSONB)
actions (JSONB) | enabled | last_executed_at | created_at | updated_at
```

#### 12. notifications 通知表

```
id | user_id | organization_id | type | title | content
channel (email/in-app) | status | sent_at | read_at | created_at
```

#### 13. notification_templates 通知模板表

```
id | organization_id | name | subject_template | body_template
variables (JSONB) | created_at | updated_at
```

---

## 权限检查流程

### 用户请求权限检查（Phase 1）

```
请求 → 提取 JWT Token → 验证 Token 有效性
  ↓
获取用户 ID
  ↓
从请求头获取组织 ID
  ↓
查询用户在该组织的角色
  ↓
查询角色的权限列表
  ↓
检查是否包含所需权限
  ↓
允许 / 拒绝请求
```

### AI 操作权限检查（Phase 2）

AI 操作在用户权限基础上叠加确认级别：

```
AI 请求执行操作
  ↓
提取当前用户 ID + 组织 ID
  ↓
查询用户在该组织的角色与权限
  ↓
检查是否有该操作的权限
  ↓ 有权限
检查该操作的 riskLevel
  ↓
AUTO → 直接执行
NOTIFY → 执行 + 通知
CONFIRM → 弹出确认 → 执行
REAUTH → 重新认证 → 执行
  ↓
写入 ai_operation_logs
```

---

## 技术选型

### 前端技术栈

| 技术 | 选择 | 理由 |
|------|------|------|
| **框架** | React 18+ | 生态成熟，社区活跃 |
| **语言** | TypeScript | 类型安全 |
| **构建工具** | Vite | 快速开发和构建 |
| **包管理** | pnpm | 高效，Monorepo 友好 |
| **UI 组件** | shadcn/ui | 完全可定制，深色模式 |
| **样式** | Tailwind CSS | 原子化设计 |
| **数据同步** | TanStack Query | 缓存管理 |
| **路由** | React Router v6 | 类型安全 |
| **表单** | React Hook Form + Zod | 轻量级、高效 |
| **深色模式** | next-themes | 零闪烁 |
| **HTTP** | axios | 拦截器支持 |
| **AI 通信** | WebSocket + SSE | 流式对话支持 |

### 后端技术栈

| 技术 | 选择 | 理由 |
|------|------|------|
| **运行时** | Node.js LTS | 全栈统一 |
| **框架** | NestJS | 企业级框架，内置 DI、Guard、Interceptor |
| **语言** | TypeScript | 类型安全 |
| **ORM** | Prisma | 类型安全、易用 |
| **API** | REST + WebSocket | REST 为主，AI 对话用 WS |
| **认证** | JWT + Passport.js | 标准化 |
| **数据库** | PostgreSQL | 功能完整，JSONB 支持灵活数据 |
| **AI 模型** | Claude API / OpenAI API | 云端 API，按量付费，功能最强 |
| **邮件** | Nodemailer | 灵活发送 |
| **日志** | console + 文件 | MVP 阶段足够 |
| **测试** | Jest | 完整框架 |

### 基础设施

- **前端**：Vercel（自动构建、CDN）
- **后端**：Railway 或 Render（Node.js 一键部署）
- **数据库**：Supabase（PostgreSQL + 文件存储）
- **总成本**：**$0-20/月**（都有免费层）+ AI API 按量计费

### 删除不必要的工具（相比完整方案）

- ❌ Redis（MVP 用户少，暂不需要）
- ❌ MongoDB（审计日志后期再加）
- ❌ Bull 消息队列（异步任务后期再加）
- ❌ GraphQL（REST 足够）
- ❌ CASL（简单权限直接用 Guards）
- ❌ 多语言库（MVP 先只用中文）
- ❌ Swagger（后期补充）

---

## 项目结构

```
saas-base-platform/
├── frontend/                    # React 前端（Vercel 部署）
│   ├── src/
│   │   ├── components/          # 组件
│   │   │   ├── common/          # 通用组件（Button、Input 等）
│   │   │   ├── layout/          # 布局组件
│   │   │   ├── forms/           # 表单组件
│   │   │   └── ai/              # AI 相关组件 [Phase 1 占位]
│   │   │       ├── AIPanel.tsx           # 全局 AI 对话面板
│   │   │       ├── AIConfirmDialog.tsx   # AI 操作确认对话框
│   │   │       └── AIWorkflowView.tsx    # AI 工作流可视化
│   │   ├── pages/               # 页面
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   └── settings/
│   │   ├── hooks/               # 自定义 Hook
│   │   │   ├── useAI.ts         # AI 对话 Hook [Phase 1 占位]
│   │   │   └── useAIContext.ts  # AI 上下文管理 [Phase 1 占位]
│   │   ├── services/            # API 调用
│   │   │   ├── ai.service.ts    # AI API 调用 [Phase 1 占位]
│   │   ├── store/               # 全局状态
│   │   ├── types/               # TypeScript 类型
│   │   ├── utils/               # 工具函数
│   │   │   ├── behavior.ts      # 前端行为追踪 [Phase 1]
│   │   ├── styles/              # 全局样式
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                     # NestJS 后端（Railway 部署）
│   ├── src/
│   │   ├── auth/                # 认证模块
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── auth.module.ts
│   │   ├── users/               # 用户模块
│   │   │   ├── users.service.ts
│   │   │   ├── users.controller.ts
│   │   │   └── users.module.ts
│   │   ├── organizations/       # 组织模块
│   │   │   ├── organizations.service.ts
│   │   │   ├── organizations.controller.ts
│   │   │   └── organizations.module.ts
│   │   ├── permissions/         # 权限模块
│   │   │   ├── permissions.service.ts
│   │   │   ├── permissions.guard.ts
│   │   │   ├── permission.decorator.ts
│   │   │   └── permissions.module.ts
│   │   ├── behavior/            # 行为追踪模块 [Phase 1 实现]
│   │   │   ├── behavior.module.ts
│   │   │   ├── behavior.service.ts
│   │   │   ├── behavior.interceptor.ts
│   │   │   └── behavior.types.ts
│   │   ├── ai/                  # AI Agent 模块 [Phase 1 预留]
│   │   │   ├── ai.module.ts
│   │   │   ├── ai.controller.ts
│   │   │   ├── ai.service.ts
│   │   │   ├── ai.gateway.ts            # WebSocket 网关
│   │   │   ├── tools/
│   │   │   │   ├── tool.registry.ts     # 工具注册中心 [Phase 1]
│   │   │   │   ├── tool.decorator.ts    # @AITool 装饰器 [Phase 1]
│   │   │   │   └── tools/               # 各模块注册的工具
│   │   │   ├── context/
│   │   │   │   ├── context.builder.ts   # 上下文构建器
│   │   │   │   └── context.types.ts
│   │   │   ├── confirmation/
│   │   │   │   ├── confirmation.service.ts
│   │   │   │   └── confirmation.types.ts
│   │   │   └── permission/
│   │   │       └── ai-permission.guard.ts
│   │   ├── workflow/            # 工作流引擎 [Phase 1 预留]
│   │   │   ├── workflow.module.ts
│   │   │   ├── workflow.service.ts
│   │   │   ├── triggers/
│   │   │   └── actions/
│   │   ├── notification/        # 通知模块 [Phase 1 预留]
│   │   │   ├── notification.module.ts
│   │   │   ├── notification.service.ts
│   │   │   └── channels/
│   │   ├── mail/                # 邮件服务
│   │   ├── common/              # 公共逻辑
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── middleware/
│   │   ├── config/              # 配置管理
│   │   ├── app.module.ts
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── test/
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── docs/
│   ├── plan-saasBasePlatform.prompt.md    # 本规划文档
│   ├── API-SPEC.md                        # API 文档
│   └── DEPLOYMENT.md                      # 部署指南
│
├── docker-compose.yml           # 本地开发
├── .env.example
└── README.md
```

---

## 开发路线图

### Phase 1：SaaS 基础框架（8 周上线）

#### 第 1-2 周：核心认证系统 + 架构基础

**目标：** 用户能注册、验证邮箱、登录；搭好 AI 预留架构

**后端任务：**

- [ ] 项目初始化（NestJS、Prisma、Docker Compose）
- [ ] PostgreSQL + Prisma Schema 定义（7 张表：users + behaviors + preferences + 权限表）
- [ ] 用户注册接口（邮箱、密码哈希）
- [ ] 邮箱验证功能（Nodemailer）
- [ ] 用户登录接口（JWT Token）
- [ ] 密码重置接口
- [ ] Tool Registry 接口定义 + @AITool 装饰器 [AI 预留]
- [ ] AI Module 骨架搭建 [AI 预留]
- [ ] 单元测试

**前端任务：**

- [ ] 项目初始化（React + Vite）
- [ ] 注册页面（表单、验证）
- [ ] 邮箱验证页面
- [ ] 登录页面
- [ ] 密码重置页面
- [ ] 路由保护
- [ ] AI 对话面板 UI 占位 [AI 预留]
- [ ] 前端行为追踪 SDK [AI 基础]

**验证标准：** ✅ 用户能完成注册→验证→登录流程

---

#### 第 3-4 周：组织和权限系统 + 行为追踪

**目标：** 创建组织、邀请成员、基础权限检查、行为数据积累

**后端任务：**

- [ ] 创建组织接口
- [ ] 邀请成员接口（邀请链接、邮件通知）
- [ ] 接受邀请接口
- [ ] 成员列表接口
- [ ] 删除成员接口
- [ ] 权限检查 Guard（@RequirePermission 装饰器）
- [ ] 角色权限定义（Admin/Member/Guest）
- [ ] BehaviorInterceptor 实现 [AI 基础]
- [ ] 关键 API 添加 @AITool 装饰器标注 [AI 基础]
- [ ] 单元测试

**前端任务：**

- [ ] 组织创建页面
- [ ] 组织 Dashboard
- [ ] 成员列表和管理页面
- [ ] 邀请成员页面
- [ ] 路由权限保护（根据用户角色）
- [ ] 无权限提示页面

**验证标准：** ✅ 能创建组织、邀请成员、权限检查生效、行为数据开始积累

---

#### 第 5-6 周：UI 完善和深色模式

**目标：** 完整的 UI、响应式布局、深色模式

**前端任务：**

- [ ] Tailwind + shadcn/ui 集成
- [ ] 完整的 UI 组件库（Button、Input、Table、Modal 等）
- [ ] 深色模式实现（next-themes）
- [ ] 响应式布局（PC + 移动端）
- [ ] 组织设置页面（名称、logo 等）
- [ ] 用户个人设置页面（头像、昵称等）
- [ ] 加载状态和错误处理
- [ ] 前端测试

**后端任务：**

- [ ] 组织信息更新接口
- [ ] 用户信息更新接口
- [ ] 头像上传接口（Supabase Storage）
- [ ] 错误响应标准化
- [ ] API 文档（Swagger，可选）

**验证标准：** ✅ 所有页面美观、响应式、支持深色模式

---

#### 第 7-8 周：部署和上线

**目标：** 上线到生产环境

**部署任务：**

- [ ] 前端部署（Vercel）
- [ ] 后端部署（Railway）
- [ ] 数据库部署（Supabase）
- [ ] 环境变量配置
- [ ] HTTPS 和自定义域名
- [ ] 性能测试和优化
- [ ] 上线前 QA
- [ ] 发布文档（README、部署指南）

**上线前检查清单：**

- [ ] 所有认证流程可用
- [ ] 所有权限检查生效
- [ ] 行为追踪数据正常写入
- [ ] 没有明显 Bug
- [ ] 性能满足基本要求
- [ ] 数据库备份配置

**验证标准：** ✅ 正式发布，可供用户使用

---

### Phase 2：AI 智能层（第 9-12 周）

#### 第 9-10 周：AI Agent 核心

**目标：** 全局 AI 对话面板可用，AI 能调用系统工具执行操作

**后端任务：**

- [ ] ContextBuilder 实现（深度上下文构建）
- [ ] Claude API / OpenAI API Function Calling 集成
- [ ] 分级确认系统（AUTO / NOTIFY / CONFIRM / REAUTH）
- [ ] WebSocket Gateway（流式对话）
- [ ] AI 操作审计日志
- [ ] 单元测试

**前端任务：**

- [ ] 全局 AI 对话面板激活（流式渲染）
- [ ] AI 操作确认对话框
- [ ] AI 上下文可视化
- [ ] AI 操作历史查看

**验证标准：** ✅ AI 面板可唤起，能理解上下文，能执行低风险操作

---

#### 第 11-12 周：工作流与行为学习

**目标：** AI 能自动发现模式、执行工作流、跨组织复用知识

**后端任务：**

- [ ] Workflow Engine（事件触发 + 定时触发）
- [ ] 行为模式分析（基于 user_behaviors 数据）
- [ ] 工作流自动发现与建议
- [ ] 跨组织知识复用（匿名化处理）
- [ ] 通知系统完善
- [ ] 单元测试

**前端任务：**

- [ ] AI 工作流可视化页面
- [ ] 工作流创建/编辑（自然语言描述）
- [ ] AI 建议卡片
- [ ] 通知中心

**验证标准：** ✅ AI 能发现重复流程、自动执行工作流、提供智能建议

---

### Phase 3：商业化（第 13+ 周）

1. **订阅计划** - 免费版、专业版、企业版
2. **支付集成** - Stripe 或支付宝
3. **审计日志** - 完整操作审计、AI 操作审计
4. **多语言** - 国际化（i18n）
5. **高级权限** - 资源级权限、自定义角色
6. **性能优化** - Redis 缓存、数据库优化

---

## 时间表总结

```
Phase 1: SaaS 基础框架
  周 1-2：核心认证 + AI 架构预留  ████
  周 3-4：组织权限 + 行为追踪     ████
  周 5-6：UI 完善                ████
  周 7-8：部署上线               ████
────────────────────────────────────
Phase 2: AI 智能层
  周 9-10：AI Agent 核心         ████
  周 11-12：工作流 + 行为学习     ████
────────────────────────────────────
Phase 3: 商业化
  第 3-4 月：订阅支付 + 审计
```

---

## 关键技术决策

### AI-native 架构原则

1. **AI 是第一等公民，不是附属功能**
   - AI 有自己的模块、数据表、权限模型
   - 所有业务模块设计时就考虑可能被 AI 调用
   - Tool Registry 是核心抽象：业务模块注册工具 → AI 发现并调用

2. **Phase 1 就要为 AI 打基础**
   - 行为追踪从第一天就开始积累数据
   - Tool Registry 和 @AITool 装饰器 Phase 1 就定义好
   - AI 模块骨架 Phase 1 就搭建，Phase 2 只做实现

3. **权限模型兼容 AI**
   - AI 在用户权限范围内操作（不越权）
   - 分级确认机制叠加在权限检查之上
   - AI 所有操作可审计

### MVP 简化原则（Phase 1）

**一人开发者应该专注核心功能，快速上线验证想法。不必过度工程化。**

1. **权限系统从 4 层改为 3 层**
   - ❌ 原：用户 → 组织 → 应用 → 模块 → 权限
   - ✅ 新：用户 → 组织 → 角色 → 权限
   - 收益：减少 40% 的代码和数据库复杂性

2. **预置 3 个固定角色，不支持自定义**
   - ✅ Admin, Member, Guest 足够初期使用
   - ⏳ Phase 2 再支持自定义角色

3. **不用 Redis，直接用数据库**
   - ✅ MVP 用户少（<1000），性能足够
   - ⏳ Phase 2 再优化缓存

4. **不用 MongoDB，暂不做审计日志**
   - ✅ PostgreSQL JSONB 足够存储灵活数据
   - ⏳ Phase 2 再加详细审计

5. **不用消息队列，异步任务后期再加**
   - ✅ 邮件同步发送可接受
   - ⏳ Phase 2 用 Bull + Redis

6. **行为数据用 JSONB，不做时序库**
   - ✅ MVP 数据量少，PostgreSQL JSONB 足够灵活
   - ⏳ 后期可迁移到 ClickHouse/TimescaleDB

### 为什么还是用 NestJS？

- ✅ DI、Guard、Interceptor 等特性非常适合 AI Agent 架构
- ✅ 装饰器模式天然匹配 Tool Registry 设计
- ✅ 虽然学习曲线陡，但长期收益大
- ✅ 适合后续扩展和交付

### 为什么用 Supabase？

- ✅ 一个服务包含 PostgreSQL、存储、Auth 等
- ✅ 完全免费层可支撑初期用户
- ✅ 一键备份和恢复
- ✅ 比自建 VPS 省心

### AI 模型选择

- ✅ 云端 API（Claude API / OpenAI API），无需运维 GPU
- ✅ Function Calling 原生支持，与 Tool Registry 天然匹配
- ✅ 按量付费，初期成本可控
- ✅ 后期可接入多个模型做负载

---

## 性能优化策略（MVP）

### 前端

- 代码分割：基于路由懒加载
- 图片优化：WebP + 懒加载
- Bundle 优化：Vite 自动处理

### 后端

- 数据库索引：在 organization_id、user_id 上建索引
- 分页查询：列表接口分页返回
- 连接池：Prisma 自动管理

**暂不需要：** Redis 缓存、数据库优化、CDN 等

---

## 安全最佳实践（MVP）

1. **认证**
   - JWT Token（24 小时过期）
   - Refresh Token（7 天过期）
   - 后端严格验证

2. **密码**
   - bcrypt 加盐哈希（10 轮）
   - 强度要求（8 字符、大小写、数字）

3. **API 安全**
   - HTTPS 强制（Vercel + Railway 自动提供）
   - CORS 配置（仅允许前端域名）
   - 基础速率限制（可选）

4. **数据安全**
   - 多租户隔离（SQL WHERE 过滤）
   - 敏感数据脱敏（不返回密码等）
   - 行为数据脱敏（跨组织复用时匿名化）
   - 定期备份（Supabase 自动）

5. **AI 安全（Phase 2）**
   - AI 操作在用户权限范围内
   - 高风险操作需用户确认
   - 所有 AI 操作记录到 ai_operation_logs
   - AI 提示词注入防御

6. **代码安全**
   - npm audit 定期扫描
   - 仅使用必要依赖

---

## 一人开发者的实战建议

### 工具链

```
编码：VS Code + Copilot
数据库：Supabase Dashboard
API 测试：Postman / REST Client（VS Code 扩展）
AI 开发：Claude Code / Cursor
部署：Git + GitHub（自动触发）
监控：Sentry（免费层）
```

### 工作流

```
周一-周五：完成一个功能（认证 → 组织 → 权限 → UI 等）
周末：部署、测试、文档
每两周：小发版（邀请早期用户测试）
```

### 快速迭代的秘诀

1. **优先做 Phase 1 的 7 张表**，不必完美
2. **Tool Registry 先定义接口，Phase 2 再接入 AI**
3. **API 先写 Mock，前端并行开发**
4. **样式用 shadcn/ui，不必自己写**
5. **行为追踪从第一天就上线，积累数据**
6. **测试只覆盖关键路径**（认证、权限、邀请）
7. **部署用一键工具**（不要自己运维）

---

## 总结

**这是一个适合一人开发者在 2 个月内上线的 AI-native SaaS MVP 方案。**

**核心原则：基础先行、AI 预留、快速验证、迭代改进**

- Phase 1（8 周）先上线 SaaS 基础框架，同时做好 AI 架构预留和行为数据积累
- Phase 2（4 周）AI 智能层上线，实现差异化竞争力
- Phase 3 考虑商业化

不要被"完美架构"绊住，不要过度工程化。**上线才是最重要的。**

现在就可以开始第一周的开发了！
