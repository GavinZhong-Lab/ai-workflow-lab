/**
 * 认证状态管理 (Zustand + localStorage 持久化)
 * 管理 JWT Token、用户信息、当前组织 ID
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** 用户基本信息 */
interface User {
  id: string;
  email: string;
  name: string | null;
}

/** 认证 Store 类型 */
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  orgId: string | null;
  setAuth: (accessToken: string, refreshToken: string, user: User, orgId?: string) => void;
  setOrgId: (orgId: string) => void;
  logout: () => void;
}

/** 认证状态 Store */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      orgId: null,

      /** 登录/注册成功后设置认证状态 */
      setAuth: (accessToken, refreshToken, user, orgId) =>
        set({ accessToken, refreshToken, user, orgId: orgId || null }),

      /** 切换当前工作组织 */
      setOrgId: (orgId) => set({ orgId }),

      /** 登出，清除所有认证信息 */
      logout: () =>
        set({ accessToken: null, refreshToken: null, user: null, orgId: null }),
    }),
    {
      name: 'saas-auth',
    },
  ),
);
