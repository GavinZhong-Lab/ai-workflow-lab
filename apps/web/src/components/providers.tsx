/**
 * 全局 Provider 组件
 * 包裹 ThemeProvider（next-themes）和 QueryClientProvider（TanStack Query）
 */
'use client';

import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/** 客户端全局 Provider 包装器 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
