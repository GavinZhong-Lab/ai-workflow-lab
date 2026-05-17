# SaaS Platform

AI-native SaaS 基础框架 — 可复用的多租户 SaaS 应用平台，提供用户管理、权限控制、订阅付款等通用能力。

## Tech Stack

| 层面 | 技术 |
|------|------|
| 前端 | Next.js 14 (App Router) · TypeScript · TailwindCSS · Framer Motion · Radix UI |
| 后端 | Node.js · Express · TypeScript · Prisma · Zod |
| 数据库 | PostgreSQL 16 |
| 缓存 | Redis 7 |
| 文件存储 | MinIO (S3 兼容) |
| 认证 | JWT (Access + Refresh Token) |
| 支付 | Paddle Billing（微信/支付宝/信用卡/PayPal） |
| 基础设施 | pnpm Workspace · Turborepo · Docker Compose |

## 项目结构

```
saas-platform/
├── apps/
│   ├── api/                    # 后端 API (Express + Prisma)
│   │   ├── src/
│   │   │   ├── modules/        # 业务模块
│   │   │   │   ├── auth/       #   注册/登录/Token
│   │   │   │   ├── user/       #   用户资料
│   │   │   │   ├── organization/ # 组织与成员管理
│   │   │   │   └── permission/ #   权限体系 (RBAC)
│   │   │   ├── middleware/     # 中间件 (auth/validate/permission)
│   │   │   └── lib/            # 工具库 (prisma/jwt)
│   │   └── prisma/             # 数据库 Schema + 种子数据
│   │
│   └── web/                    # 前端 (Next.js 14)
│       └── src/
│           ├── app/[locale]/   # 页面路由
│           │   ├── (auth)/     #   登录/注册
│           │   └── (dashboard)/#   工作台/项目管理/成员/账单
│           ├── components/     # 共享组件
│           ├── stores/         # Zustand 状态管理
│           ├── hooks/          # 自定义 Hooks
│           └── i18n/           # 国际化 (zh-CN/en-US)
│
├── packages/
│   └── shared/                 # 前后端共享类型与常量
│
└── docs/                       # 设计文档
    └── SaaS基础框架/           #   业务逻辑/技术方案/数据模型
```

## 快速开始

### 前置要求

- Node.js >= 20
- pnpm >= 9
- Docker Desktop

### 1. 启动基础设施

```bash
docker compose up -d
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 初始化数据库

```bash
cd apps/api
cp .env.example .env  # 编辑 .env 填写实际配置
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. 启动开发服务器

```bash
# 后端 API (端口 4000)
cd apps/api
pnpm dev

# 前端 (端口 3000)
cd apps/web
pnpm dev
```

启动后访问 http://localhost:3000

## API 接口

| 模块 | 端点 | 说明 |
|------|------|------|
| Auth | POST /api/v1/auth/register | 用户注册 |
| Auth | POST /api/v1/auth/login | 用户登录 |
| Auth | POST /api/v1/auth/refresh | 刷新 Token |
| Auth | GET /api/v1/auth/me | 获取当前用户 |
| Users | GET /api/v1/users/me | 用户信息 |
| Users | PATCH /api/v1/users/me | 更新资料 |
| Users | GET /api/v1/users/me/organizations | 组织列表 |
| Organizations | POST /api/v1/organizations | 创建组织 |
| Organizations | GET /api/v1/organizations/:id | 组织详情 |
| Organizations | GET /api/v1/organizations/:id/members | 成员列表 |
| Organizations | POST /api/v1/organizations/:id/members | 邀请成员 |
| Permissions | GET /api/v1/permissions/applications | 应用列表 |
| Permissions | POST /api/v1/permissions/applications | 注册应用 |
| Permissions | GET /api/v1/permissions/orgs/:id/roles | 角色列表 |
| Permissions | POST /api/v1/permissions/orgs/:id/roles | 创建角色 |

## 功能特性

- **多租户** — 用户可加入多个组织，组织间数据隔离
- **RBAC 权限** — 组织 → 角色 → 应用 → 模块 四级权限控制
- **JWT 认证** — Access Token + Refresh Token 双 Token 机制
- **国际化** — 中文 / 英文切换
- **主题切换** — Dark / Light / 跟随系统
- **响应式** — PC + 移动端适配

## 设计理念

1. **设计先行** — 每个模块先输出业务逻辑/技术方案/数据模型文档，再编码
2. **模块化** — Express 按功能拆分为 controller/service/schema/routes
3. **类型安全** — 前后端共享 TypeScript 类型，Zod 校验 + Prisma 类型推断
4. **安全优先** — bcrypt 密码加密、JWT RSA 签名、参数化查询、Rate Limiting

## 文档

- [业务逻辑](docs/SaaS基础框架/业务逻辑.md)
- [技术方案](docs/SaaS基础框架/技术方案.md)
- [数据模型](docs/SaaS基础框架/数据模型.md)
- [项目总规划](docs/项目总规划.md)

## License

MIT
