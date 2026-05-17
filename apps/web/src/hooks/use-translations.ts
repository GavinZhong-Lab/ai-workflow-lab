/**
 * 简易 i18n Hook
 * 直接加载 JSON 翻译文件，无需 next-intl 依赖
 */
'use client';

import { useParams } from 'next/navigation';
import zhCN from '@/i18n/zh-CN.json';
import enUS from '@/i18n/en-US.json';

type Messages = typeof zhCN;

const messagesMap: Record<string, Messages> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

/** 获取翻译函数，支持嵌套 key（如 "auth.login"） */
export function useTranslations(scope?: string) {
  const params = useParams();
  const locale = (params?.locale as string) || 'zh-CN';
  const messages = messagesMap[locale] || messagesMap['zh-CN'];

  function t(key: string): string {
    const keys = scope ? `${scope}.${key}` : key;
    const value = keys.split('.').reduce((obj: unknown, k) => {
      if (typeof obj === 'object' && obj !== null && k in obj) {
        return (obj as Record<string, unknown>)[k];
      }
      return undefined;
    }, messages as unknown as Record<string, unknown>);
    return typeof value === 'string' ? value : key;
  }

  return t;
}
