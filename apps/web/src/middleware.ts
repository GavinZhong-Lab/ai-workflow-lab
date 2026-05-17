/**
 * 国际化中间件
 * 对未带语言前缀的请求进行重定向
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['zh-CN', 'en-US'];
const defaultLocale = 'zh-CN';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 跳过静态资源和 API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 检查是否已包含 locale 前缀
  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (!pathnameHasLocale) {
    // 从 Accept-Language 头检测语言偏好
    const acceptLang = request.headers.get('accept-language');
    let locale = defaultLocale;
    if (acceptLang?.startsWith('en')) {
      locale = 'en-US';
    }

    const newUrl = new URL(`/${locale}${pathname}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
};
