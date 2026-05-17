/**
 * 路由守卫 Hook
 * 等待 Zustand persist rehydration 完成后再检查认证状态
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

/** 检查认证状态，未认证时跳转到登录页 */
export function useAuthGuard(locale: string) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.push(`/${locale}/login`);
    }
  }, [hydrated, accessToken, locale, router]);

  // 尚未 rehydrate 完成时当作已认证（不跳转），rehydrate 后检查
  return { isAuthenticated: !hydrated || !!accessToken };
}
