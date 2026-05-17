/**
 * 侧边栏导航组件
 * 显示 Logo、主导航菜单、当前用户信息
 * 使用 glass-morphism 风格 + 活跃指示器动画
 */
'use client';

import { useTranslations } from '@/hooks/use-translations';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth';

/** 导航菜单项定义 */
const navItems = [
  { key: 'dashboard', href: '/dashboard', icon: DashboardIcon },
  { key: 'projects', href: '/projects', icon: ProjectsIcon },
  { key: 'members', href: '/members', icon: MembersIcon },
  { key: 'billing', href: '/billing', icon: BillingIcon },
  { key: 'settings', href: '/settings', icon: SettingsIcon },
];

/** 侧边栏组件 */
export function Sidebar({ locale }: { locale: string }) {
  const t = useTranslations('sidebar');
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  return (
    <aside className="w-64 h-screen flex flex-col glass-surface rounded-none border-t-0 border-b-0 border-l-0">
      {/* Logo 区域 */}
      <div className="h-16 flex items-center px-6 border-b border-ink-800/50">
        <Link href={`/${locale}/dashboard`} className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-ink-950 font-bold text-sm shadow-lg shadow-amber-500/20">
            S
          </div>
          <span className="font-display text-lg text-white tracking-tight">SaaS</span>
        </Link>
      </div>

      {/* 主导航 */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const href = `/${locale}${item.href}`;
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={item.key}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'text-ink-400 hover:text-ink-200 hover:bg-ink-800/40',
              )}
            >
              <item.icon active={isActive} />
              <span>{t(item.key)}</span>
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="ml-auto w-1 h-5 rounded-full bg-amber-500"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* 用户信息 */}
      <div className="p-3 border-t border-ink-800/50">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ink-600 to-ink-700 flex items-center justify-center text-xs font-medium text-ink-300 ring-1 ring-ink-700">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-200 truncate">
              {user?.name || user?.email}
            </p>
            <p className="text-xs text-ink-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ---- 侧边栏图标组件 ----

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={active ? 'text-amber-500' : 'text-ink-500'}>
      <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.8" />
      <rect x="11" y="2" width="7" height="4" rx="1.5" fill="currentColor" opacity="0.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.3" />
      <rect x="11" y="8" width="7" height="10" rx="1.5" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

function ProjectsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={active ? 'text-amber-500' : 'text-ink-500'}>
      <path d="M3 5a2 2 0 012-2h3a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" fill="currentColor" opacity="0.8" />
      <path d="M3 13a2 2 0 012-2h3a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2z" fill="currentColor" opacity="0.4" />
      <path d="M11 5a2 2 0 012-2h2a2 2 0 012 2v7a2 2 0 01-2 2h-2a2 2 0 01-2-2V5z" fill="currentColor" opacity="0.2" />
    </svg>
  );
}

function MembersIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={active ? 'text-amber-500' : 'text-ink-500'}>
      <circle cx="7" cy="7" r="3" fill="currentColor" opacity="0.8" />
      <circle cx="13" cy="10" r="2.5" fill="currentColor" opacity="0.5" />
      <path d="M1 16c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="currentColor" opacity="0.3" />
      <path d="M10 14c0-2 1.3-3.7 3-4.4" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
}

function BillingIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={active ? 'text-amber-500' : 'text-ink-500'}>
      <rect x="2" y="4" width="16" height="12" rx="2" fill="currentColor" opacity="0.15" />
      <path d="M2 8h16" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={active ? 'text-amber-500' : 'text-ink-500'}>
      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" fill="currentColor" opacity="0.6" />
      <path d="M16.2 12.5l.8-.5-1-1.7-.9.5a6 6 0 00-1-.6l-.1-1h-2l-.1 1a6 6 0 00-1 .6l-.9-.5-1 1.7.8.5a6 6 0 000 1.2l-.8.5 1 1.7.9-.5c.3.2.6.4 1 .5l.1 1h2l.1-1c.4-.1.7-.3 1-.5l.9.5 1-1.7-.8-.5a6 6 0 000-1.2z" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
    </svg>
  );
}
