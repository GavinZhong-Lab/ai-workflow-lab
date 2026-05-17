/**
 * 通用工具函数
 * API 响应构造、校验、字符串处理
 */

import type { ApiResponse, PaginatedData } from '../types/index.js';

/** 构造成功响应 */
export function ok<T>(data: T, message = 'ok'): ApiResponse<T> {
  return { code: 0, data, message };
}

/** 构造错误响应 */
export function err(code: number, message: string): ApiResponse<null> {
  return { code, data: null, message };
}

/** 构造分页响应 */
export function paginated<T>(
  list: T[],
  total: number,
  page: number,
  pageSize: number,
): ApiResponse<PaginatedData<T>> {
  return ok({ list, total, page, pageSize });
}

/** 校验邮箱格式 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** 转换为 URL Slug 格式 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
