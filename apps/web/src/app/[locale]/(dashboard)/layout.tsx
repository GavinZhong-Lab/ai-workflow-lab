/**
 * 工作台布局
 * 顶部 Header + 左侧 Sidebar + 右侧主内容区
 * 包含路由守卫和移动端 Sidebar 状态管理
 */
'use client';

import { useState, useCallback } from 'react';
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
    <div className="flex h-screen bg-[rgb(var(--color-bg))]">
      <Sidebar locale={params.locale} mobileOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuToggle={openSidebar} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
