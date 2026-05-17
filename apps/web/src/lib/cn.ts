/**
 * 样式合并工具
 * 组合 clsx 和 tailwind-merge，智能合并 Tailwind 类名
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** 合并并去重 Tailwind CSS 类名 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
