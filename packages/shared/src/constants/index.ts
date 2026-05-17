/**
 * 全局常量定义
 * 错误码、系统角色、权限操作等前后端共用常量
 */

/** API 错误码枚举 */
export const ErrorCode = {
  OK: 0,

  // 参数校验 (400xx)
  VALIDATION_ERROR: 40000,
  INVALID_EMAIL: 40001,
  WEAK_PASSWORD: 40002,
  INVALID_SLUG: 40003,

  // 认证 (401xx)
  UNAUTHORIZED: 40100,
  INVALID_CREDENTIALS: 40101,
  TOKEN_EXPIRED: 40102,
  TOKEN_INVALID: 40103,
  EMAIL_NOT_VERIFIED: 40104,

  // 权限 (403xx)
  FORBIDDEN: 40300,
  INSUFFICIENT_PERMISSIONS: 40301,
  ORG_ACCESS_DENIED: 40302,

  // 资源不存在 (404xx)
  NOT_FOUND: 40400,
  USER_NOT_FOUND: 40401,
  ORG_NOT_FOUND: 40402,
  ROLE_NOT_FOUND: 40403,

  // 冲突 (409xx)
  CONFLICT: 40900,
  EMAIL_ALREADY_EXISTS: 40901,
  SLUG_ALREADY_EXISTS: 40902,

  // 限流 (429xx)
  RATE_LIMIT: 42900,

  // 服务端错误 (500xx)
  INTERNAL_ERROR: 50000,
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

/** 系统预置角色 key */
export const SystemRole = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

export type SystemRoleValue = (typeof SystemRole)[keyof typeof SystemRole];

/** 权限操作类型常量 */
export const PermissionActions = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
} as const;

/** 订阅状态 */
export const SubscriptionStatus = {
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  EXPIRED: 'expired',
} as const;
