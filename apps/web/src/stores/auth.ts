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
  isSuperAdmin?: boolean;
}

/** 认证 Store 类型 */
export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  orgId: string | null;
  orgName: string | null;
  hydrated: boolean;
  setAuth: (accessToken: string, refreshToken: string, user: User, orgId?: string) => void;
  setOrgId: (orgId: string) => void;
  setOrgName: (orgName: string) => void;
  logout: () => void;
  setHydrated: (hydrated: boolean) => void;
}

/** 认证状态 Store */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      orgId: null,
      orgName: null,
      hydrated: false,

      setAuth: (accessToken, refreshToken, user, orgId) =>
        set({ accessToken, refreshToken, user, orgId: orgId || null }),

      setOrgId: (orgId) => set({ orgId }),

      setOrgName: (orgName) => set({ orgName }),

      logout: () =>
        set({ accessToken: null, refreshToken: null, user: null, orgId: null, orgName: null }),

      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: 'saas-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
