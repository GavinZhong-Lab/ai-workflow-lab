/**
 * 国际化配置
 * 定义支持的语言列表及默认语言
 */

/** 支持的语言 */
export const locales = ['zh-CN', 'en-US'] as const;
export type Locale = (typeof locales)[number];

/** 默认语言 */
export const defaultLocale: Locale = 'zh-CN';
