/**
 * 侧边栏导航组件
 * 桌面端固定左侧，移动端 overlay drawer
 * 支持展开/收起、企业名称展示、超级管理员菜单
 */
'use client';

import { useTranslations } from '@/hooks/use-translations';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useAuthStore, type AuthState } from '@/stores/auth';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ChevronLeft, ChevronRight, Shield, LayoutDashboard, Grid3x3, Users, CreditCard, Settings, BookOpen, Star } from 'lucide-react';

const navItems = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'apps', href: '/apps', icon: Grid3x3 },
  { key: 'members', href: '/members', icon: Users },
  { key: 'billing', href: '/billing', icon: CreditCard },
  { key: 'settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  locale: string;
  mobileOpen?: boolean;
  onClose?: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mounted?: boolean;
}

export function Sidebar({ locale, mobileOpen, onClose, collapsed, onToggleCollapse, mounted }: SidebarProps) {
  const t = useTranslations('sidebar');
  const tr = useTranslations('reader');
  const pathname = usePathname();
  const user = useAuthStore((s: AuthState) => s.user);
  const orgName = useAuthStore((s: AuthState) => s.orgName);
  const [planName, setPlanName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get<{ code: number; data: { subscription: { planName: string } | null } }>('/api/v1/subscriptions/current')
      .then((res) => {
        if (!cancelled && res.code === 0 && res.data?.subscription?.planName) {
          setPlanName(res.data.subscription.planName);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // 简短的套餐名：去掉括号内的内容（如"年付"、"月付"）
  const shortPlanName = planName?.replace(/\s*\(.*?\)\s*/g, '') || null;

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const orgInitial = (orgName || user?.name || '?')[0].toUpperCase();

  const sidebarContent = (
    <aside
      className={cn(
        'h-full flex flex-col bg-[rgb(var(--color-surface))] border-r border-[rgb(var(--color-border))] transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo / 企业名称 */}
      <div className={cn('h-16 flex items-center border-b border-[rgb(var(--color-border))] shrink-0 transition-all', collapsed ? 'px-2 justify-center' : 'px-4')}>
        <Link href={`/${locale}/dashboard`} className="flex items-center gap-3 group min-w-0" onClick={onClose}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-ink-950 font-bold text-sm shadow-lg shadow-amber-500/20 shrink-0">
            {orgInitial}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-display text-lg text-[rgb(var(--color-text))] tracking-tight truncate overflow-hidden whitespace-nowrap"
              >
                {orgName || 'SaaS'}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* 导航 — 收起状态 tooltip 向右侧主内容区弹出，避免被 overflow 裁剪 */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const href = `/${locale}${item.href}`;
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={item.key}
              href={href}
              onClick={onClose}
              title={collapsed ? t(item.key) : undefined}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-border))]',
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{t(item.key)}</span>}
              {isActive && !collapsed && (
                <motion.div
                  layoutId="nav-active"
                  className="ml-auto w-1 h-5 rounded-full bg-amber-500"
                />
              )}
              {/* 收起时悬浮气泡 — 向 icon 右侧弹出到主内容区，不被 nav overflow 裁剪 */}
              {collapsed && mounted && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-md bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] text-xs font-medium text-[rgb(var(--color-text))] shadow-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-[opacity,visibility] duration-150 delay-200 z-50 pointer-events-none">
                  {t(item.key)}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-r-[5px] border-r-[rgb(var(--color-border))]" />
                  <div className="absolute right-full top-1/2 -translate-y-1/2 translate-x-px w-0 h-0 border-y-[4px] border-y-transparent border-r-[4px] border-r-[rgb(var(--color-surface))]" />
                </div>
              )}
            </Link>
          );
        })}

        {/* 超级管理员菜单 */}
        {user?.isSuperAdmin && (
          <>
            <div className={cn('my-2 border-t border-[rgb(var(--color-border))]')} />
            <Link
              href={`/${locale}/admin/apps`}
              onClick={onClose}
              title={collapsed ? t('appManagement') : undefined}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                collapsed && 'justify-center px-2',
                pathname.startsWith(`/${locale}/admin/apps`)
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-border))]',
              )}
            >
              <Shield className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{t('appManagement')}</span>}
              {collapsed && mounted && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-md bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] text-xs font-medium text-[rgb(var(--color-text))] shadow-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-[opacity,visibility] duration-150 delay-200 z-50 pointer-events-none">
                  {t('appManagement')}
                </div>
              )}
            </Link>
            <Link
              href={`/${locale}/admin/reader`}
              onClick={onClose}
              title={collapsed ? tr('admin.readerAdmin') : undefined}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                collapsed && 'justify-center px-2',
                pathname.startsWith(`/${locale}/admin/reader`)
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-border))]',
              )}
            >
              <BookOpen className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{tr('admin.readerAdmin')}</span>}
              {collapsed && mounted && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-md bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] text-xs font-medium text-[rgb(var(--color-text))] shadow-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-[opacity,visibility] duration-150 delay-200 z-50 pointer-events-none">
                  {tr('admin.readerAdmin')}
                </div>
              )}
            </Link>
          </>
        )}
      </nav>

      {/* 底部：用户信息 + 收起按钮 */}
      <div className="p-2 border-t border-[rgb(var(--color-border))] shrink-0 space-y-2">
        <div className={cn('flex items-center gap-3', collapsed ? 'justify-center px-1 py-1' : 'px-2 py-1')}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-600/30 flex items-center justify-center text-xs font-medium text-[rgb(var(--color-text))] ring-1 ring-[rgb(var(--color-border))] shrink-0">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[rgb(var(--color-text))] truncate flex items-center gap-1.5">
                <span className="truncate">{user?.name || user?.email}</span>
                {shortPlanName && (
                  <span className="text-xs font-medium text-amber-500 shrink-0">{shortPlanName}</span>
                )}
              </p>
              <p className="text-xs text-[rgb(var(--color-text-muted))] truncate">{user?.email}</p>
            </div>
          )}
        </div>

        {/* 展开/收起按钮 */}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-1.5 rounded-lg text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] bg-[rgb(var(--color-text)/0.06)] hover:bg-[rgb(var(--color-text)/0.12)] transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* 桌面端 */}
      <div className="hidden lg:block h-screen shrink-0">{sidebarContent}</div>

      {/* 移动端 */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-full lg:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

