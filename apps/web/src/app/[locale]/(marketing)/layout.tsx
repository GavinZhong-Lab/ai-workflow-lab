/**
 * 公开营销页面布局
 * 顶栏（主题/语言切换）+ 内容 + 页脚
 */
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
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
    <div className="min-h-screen flex flex-col bg-[rgb(var(--color-bg))]">
      {/* Top bar */}
      <div className="sticky top-0 z-50 h-12 flex items-center justify-between px-4 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))]/80 backdrop-blur-md">
        <a href={`/${currentLocale}`} className="text-sm font-semibold text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-accent))] transition-colors">
          AI Workflow Lab
        </a>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors"
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
          <div className="flex items-center gap-px bg-[rgb(var(--color-surface))] rounded-md p-0.5">
            <button
              onClick={() => switchLocale('zh-CN')}
              className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                currentLocale === 'zh-CN'
                  ? 'bg-[rgb(var(--color-accent))/20] text-[rgb(var(--color-accent))]'
                  : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]'
              }`}
            >
              中
            </button>
            <button
              onClick={() => switchLocale('en-US')}
              className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                currentLocale === 'en-US'
                  ? 'bg-[rgb(var(--color-accent))/20] text-[rgb(var(--color-accent))]'
                  : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
