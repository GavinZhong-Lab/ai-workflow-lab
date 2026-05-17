/**
 * 前后端共享的 TypeScript 类型定义
 * 包含 API 响应格式、用户、组织、权限、订阅等 DTO 类型
 */

/** API 统一响应结构 */
export interface ApiResponse<T = unknown> {
  code: number;
  data: T | null;
  message: string;
}

/** 分页数据结构 */
export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** 分页响应类型别名 */
export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

// ============ Auth 认证相关 ============

/** 登录请求参数 */
export interface LoginRequest {
  email: string;
  password: string;
}

/** 注册请求参数 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

/** JWT Token 对 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** JWT 载荷 */
export interface JwtPayload {
  sub: string;
  orgId?: string;
}

// ============ User 用户相关 ============

/** 用户公开信息 */
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  locale: string;
  theme: string;
  emailVerifiedAt: string | null;
  createdAt: string;
}

/** 更新用户资料请求 */
export interface UpdateUserRequest {
  name?: string;
  locale?: string;
  theme?: string;
}

// ============ Organization 组织相关 ============

/** 组织基本信息 */
export interface OrganizationInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  role: string;
  createdAt: string;
}

/** 创建组织请求 */
export interface CreateOrgRequest {
  name: string;
  slug: string;
}

/** 更新组织请求 */
export interface UpdateOrgRequest {
  name?: string;
  logoUrl?: string;
}

// ============ Role & Permission 权限相关 ============

/** 权限操作类型 */
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage';

/** 权限详细信息 */
export interface PermissionInfo {
  id: string;
  moduleId: string;
  moduleName: string;
  applicationId: string;
  applicationName: string;
  action: PermissionAction;
}

/** 角色信息（含权限列表） */
export interface RoleInfo {
  id: string;
  name: string;
  isSystem: boolean;
  permissions: PermissionInfo[];
}

// ============ Subscription 订阅相关 ============

/** 计费周期 */
export type BillingPeriod = 'monthly' | 'yearly';

/** 订阅计划信息 */
export interface PlanInfo {
  id: string;
  name: string;
  billingPeriod: BillingPeriod | null;
  amountCents: number;
  currency: string;
  features: string[];
}

/** 当前订阅状态 */
export interface SubscriptionInfo {
  id: string;
  planName: string;
  status: 'active' | 'past_due' | 'canceled' | 'expired';
  currentPeriodStart: string;
  currentPeriodEnd: string;
}
