/**
 * 顶部 Header 组件
 * 提供主题切换、语言切换、登出功能
 */
'use client';

import { useTheme } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

/** Header 工具栏 */
export function Header() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);

  /** 切换 Dark / Light 主题 */
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  /** 切换界面语言 */
  const switchLocale = (locale: string) => {
    const segments = pathname.split('/');
    segments[1] = locale;
    router.push(segments.join('/'));
  };

  /** 登出 */
  const handleLogout = () => {
    logout();
    const locale = pathname.split('/')[1] || 'zh-CN';
    router.push(`/${locale}/login`);
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-ink-800/50">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-ink-800/40 text-ink-400 hover:text-ink-200 transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <button
          onClick={() => switchLocale('zh-CN')}
          className="px-2 py-1 text-xs font-medium rounded text-ink-400 hover:text-ink-200 transition-colors"
        >
          中
        </button>
        <button
          onClick={() => switchLocale('en-US')}
          className="px-2 py-1 text-xs font-medium rounded text-ink-400 hover:text-ink-200 transition-colors"
        >
          EN
        </button>
      </div>
      <button
        onClick={handleLogout}
        className="text-sm text-ink-400 hover:text-ink-200 transition-colors"
      >
        Sign out
      </button>
    </header>
  );
}

/** 太阳图标（暗色模式时显示，点击切换到亮色） */
function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <path
        d="M9 3V1M9 17v-2M15 9h2M1 9h2M13.2 4.8l1.4-1.4M3.4 14.6l1.4-1.4M13.2 13.2l1.4 1.4M3.4 3.4l1.4 1.4M12 9a3 3 0 11-6 0 3 3 0 016 0z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

/** 月亮图标（亮色模式时显示，点击切换到暗色） */
function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <path
        d="M15.5 12.5A7 7 0 015.5 2.5 7 7 0 1015.5 12.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}
