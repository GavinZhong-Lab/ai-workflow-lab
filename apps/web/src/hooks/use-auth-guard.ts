/**
 * 路由守卫 Hook
 * 未登录用户自动跳转到登录页
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

/** 检查认证状态，未认证时跳转到登录页 */
export function useAuthGuard(locale: string) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) {
      router.push(`/${locale}/login`);
    }
  }, [accessToken, locale, router]);

  return { isAuthenticated: !!accessToken };
}
