/**
 * 认证页面布局
 * 登录/注册页面使用独立布局，含主题切换 + 语言切换
 */
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const switchLocale = (locale: string) => {
    const segments = pathname.split('/');
    segments[1] = locale;
    router.push(segments.join('/'));
  };

  const currentLocale = pathname.split('/')[1] || 'zh-CN';

  return (
    <>
      {/* Top bar: theme + language */}
      <div className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-end gap-1 px-4">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-ink-800 text-ink-400 hover:text-ink-200 transition-colors"
          title={mounted && theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
        >
          {mounted ? (
            theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="9" cy="9" r="3" />
                <path d="M9 3V1M9 17v-2M15 9h2M1 9h2M13.2 4.8l1.4-1.4M3.4 14.6l1.4-1.4M13.2 13.2l1.4 1.4M3.4 3.4l1.4 1.4" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15.5 12.5A7 7 0 015.5 2.5 7 7 0 1015.5 12.5z" />
              </svg>
            )
          ) : null}
        </button>

        {/* Language switcher */}
        <div className="flex items-center gap-px bg-ink-800 rounded-md p-0.5">
          <button
            onClick={() => switchLocale('zh-CN')}
            className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
              currentLocale === 'zh-CN'
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            中
          </button>
          <button
            onClick={() => switchLocale('en-US')}
            className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
              currentLocale === 'en-US'
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      {children}
    </>
  );
}
