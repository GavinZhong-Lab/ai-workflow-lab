/**
 * next-intl 配置
 * 定义支持的语言和默认语言
 */
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // 确保使用支持的语言
  if (!locale || !['zh-CN', 'en-US'].includes(locale as string)) {
    locale = 'zh-CN';
  }

  return {
    locale,
    messages: (await import(`./i18n/${locale}.json`)).default,
  };
});
