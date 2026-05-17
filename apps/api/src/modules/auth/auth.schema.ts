/**
 * 认证模块 — Zod 校验 Schema
 * 定义注册、登录、刷新 Token 的请求参数校验规则
 */
import { z } from 'zod';

/** 注册请求校验 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  name: z.string().min(1, 'Name is required').max(100),
});

/** 登录请求校验 */
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

/** 刷新 Token 请求校验 */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
