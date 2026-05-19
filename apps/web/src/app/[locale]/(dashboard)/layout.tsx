/**
 * 工作台布局
 * 顶部 Header + 左侧 Sidebar + 右侧主内容区
 * 包含路由守卫、移动端 Sidebar 状态、Sidebar 展开/收起管理
 */
'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuthGuard } from '@/hooks/use-auth-guard';

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { isAuthenticated } = useAuthGuard(params.locale);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sidebar 展开/收起：持久化到 localStorage（客户端初始化，避免 hydration 不匹配）
  const [collapsed, setCollapsed] = useState(false);

  const pathname = usePathname();
  const isAppsRoute = pathname?.includes('/apps') || pathname?.includes('/admin/apps');

  useEffect(() => {
    setMounted(true);
  }, []);

  // 进入应用模块自动收起，离开恢复
  useEffect(() => {
    if (isAppsRoute) {
      setCollapsed(true);
    } else {
      const stored = localStorage.getItem('sidebar-collapsed') === 'true';
      setCollapsed(stored);
    }
  }, [isAppsRoute]);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  }, []);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-950">
        <div className="text-ink-400">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[rgb(var(--color-bg))] overflow-x-hidden">
      {mounted && (
        <Sidebar
          locale={params.locale}
          mobileOpen={sidebarOpen}
          onClose={closeSidebar}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          mounted={mounted}
        />
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuToggle={openSidebar} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
