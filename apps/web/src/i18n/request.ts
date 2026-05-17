/**
 * next-intl 服务端配置
 * 根据当前语言动态加载翻译文件
 */
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./${locale}.json`)).default,
}));
