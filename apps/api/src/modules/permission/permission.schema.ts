/**
 * 权限模块 — Zod 校验 Schema
 */
import { z } from 'zod';

/** 创建应用校验 */
export const createApplicationSchema = z.object({
  name: z.string().min(1).max(100),
  key: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z][a-z0-9_]*$/, 'Key must be snake_case'),
  description: z.string().optional(),
});

/** 创建模块校验 */
export const createModuleSchema = z.object({
  name: z.string().min(1).max(100),
  key: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z][a-z0-9_]*$/, 'Key must be snake_case'),
  description: z.string().optional(),
});

/** 创建角色校验 */
export const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  permissionIds: z.array(z.string().uuid()),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
