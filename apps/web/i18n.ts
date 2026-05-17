/**
 * next-intl 配置（项目根目录）
 * 定义支持的语言、默认语言、翻译文件加载
 */
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !['zh-CN', 'en-US'].includes(locale as string)) {
    locale = 'zh-CN';
  }

  return {
    locale,
    messages: (await import(`./src/i18n/${locale}.json`)).default,
  };
});
