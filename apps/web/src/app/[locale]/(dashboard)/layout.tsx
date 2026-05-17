/**
 * 工作台布局
 * 左侧固定 Sidebar + 右侧主内容区域
 */
'use client';

import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <div className="flex h-screen bg-ink-950">
      <Sidebar locale={params.locale} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
