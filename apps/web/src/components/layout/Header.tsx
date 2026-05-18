/**
 * 顶部 Header 组件
 * 提供：汉堡按钮（移动端）、主题切换、语言切换、用户菜单（登出）
 */
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useTranslations } from '@/hooks/use-translations';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => setMounted(true), []);
  const pathname = usePathname();
  const t = useTranslations('common');
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const switchLocale = (locale: string) => {
    const segments = pathname.split('/');
    segments[1] = locale;
    router.push(segments.join('/'));
  };

  const handleLogout = () => {
    logout();
    const locale = pathname.split('/')[1] || 'zh-CN';
    router.push(`/${locale}/login`);
  };

  const currentLocale = pathname.split('/')[1] || 'zh-CN';

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))]">
      <div className="flex items-center gap-3">
        {/* 移动端汉堡按钮 */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-[rgb(var(--color-border))] text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors"
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>
        )}

        {/* 主题切换 */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-[rgb(var(--color-border))] text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors"
          title={mounted && theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
        >
          {mounted && theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* 语言切换 */}
        <div className="flex items-center gap-1 bg-[rgb(var(--color-border))/30] rounded-lg p-0.5">
          <button
            onClick={() => switchLocale('zh-CN')}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
              currentLocale === 'zh-CN'
                ? 'bg-amber-500/20 text-amber-500'
                : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]'
            }`}
          >
            中
          </button>
          <button
            onClick={() => switchLocale('en-US')}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
              currentLocale === 'en-US'
                ? 'bg-amber-500/20 text-amber-500'
                : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      {/* 右侧：用户信息 + 退出 */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-600/30 flex items-center justify-center text-xs font-medium text-[rgb(var(--color-text))] ring-1 ring-[rgb(var(--color-border))]">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <span className="text-sm text-[rgb(var(--color-text))]">{user?.name || user?.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-[rgb(var(--color-text-muted))] hover:text-red-400 transition-colors px-2 py-1"
        >
          {t('signOut')}
        </button>
      </div>
    </header>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="9" r="3" />
      <path d="M9 3V1M9 17v-2M15 9h2M1 9h2M13.2 4.8l1.4-1.4M3.4 14.6l1.4-1.4M13.2 13.2l1.4 1.4M3.4 3.4l1.4 1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M15.5 12.5A7 7 0 015.5 2.5 7 7 0 1015.5 12.5z" />
    </svg>
  );
}
