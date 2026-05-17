/**
 * 用户模块 — Zod 校验 Schema
 */
import { z } from 'zod';

/** 更新用户资料校验 */
export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  locale: z.enum(['zh-CN', 'en-US']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
