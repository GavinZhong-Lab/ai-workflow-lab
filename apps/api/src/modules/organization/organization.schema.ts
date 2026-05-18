/**
 * 组织模块 — Zod 校验 Schema
 */
import { z } from 'zod';

/** 创建组织校验 */
export const createOrgSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
});

/** 更新组织校验 */
export const updateOrgSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  logoUrl: z.string().url().optional(),
});

/** 邀请成员校验 */
export const inviteMemberSchema = z.object({
  email: z.string().email(),
  roleId: z.string().min(1),
});

/** 修改成员角色校验 */
export const updateMemberRoleSchema = z.object({
  roleId: z.string().min(1),
});

export type CreateOrgInput = z.infer<typeof createOrgSchema>;
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
