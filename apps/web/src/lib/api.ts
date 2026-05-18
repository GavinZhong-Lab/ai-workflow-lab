/**
 * API 请求客户端
 * 封装 fetch，自动注入 JWT、401 自动刷新、JSON 解析
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let getAuthStore: (() => any) | null = null;

/** 注册 auth store getter（由 Provider 层注入） */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setAuthStoreGetter(fn: () => any) {
  getAuthStore = fn;
}

/** 兼容旧的 token getter（供中间件等使用） */
export function setTokenGetter(fn: () => string | null) {
  // kept for backward compat — now handled via auth store
}

/** API 错误类 */
export class ApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}

// ---- Token 刷新并发控制 ----

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

async function refreshAccessToken(): Promise<string> {
  const store = getAuthStore?.();
  if (!store) throw new Error('Auth store not available');

  const state = store.getState?.() || {};
  const { refreshToken } = state;
  if (!refreshToken) throw new Error('No refresh token');

  const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const json = await res.json();

  if (!res.ok || !json.data?.accessToken) {
    store.logout?.();
    throw new Error('Refresh failed');
  }

  // 保留现有 user/orgId 只更新 tokens
  const currentState = store.getState?.() || {};
  store.setAuth?.(json.data.accessToken, json.data.refreshToken, currentState as unknown as never);

  return json.data.accessToken;
}

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

/** 通用请求方法 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const store = getAuthStore?.();
  const token = store?.getState?.()?.accessToken;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // 401 自动刷新
  if (res.status === 401) {
    const body = await res.json().catch(() => ({}));
    const code = body.code;

    // 只对 TOKEN_EXPIRED / TOKEN_INVALID 尝试刷新
    if (code === 40102 || code === 40103) {
      if (isRefreshing) {
        // 等待正在进行的刷新
        const newToken = await new Promise<string>((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        });
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryRes = await fetch(`${API_BASE}${path}`, { ...options, headers });
        const retryJson = await retryRes.json();
        if (!retryRes.ok) {
          throw new ApiError(retryJson.code || 50000, retryJson.message || 'Request failed');
        }
        return retryJson;
      }

      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        // 通知所有排队请求
        pendingQueue.forEach((p) => p.resolve(newToken));
        pendingQueue = [];

        // 用新 token 重试原请求
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryRes = await fetch(`${API_BASE}${path}`, { ...options, headers });
        const retryJson = await retryRes.json();
        if (!retryRes.ok) {
          throw new ApiError(retryJson.code || 50000, retryJson.message || 'Request failed');
        }
        return retryJson;
      } catch (refreshErr) {
        pendingQueue.forEach((p) => p.reject(refreshErr));
        pendingQueue = [];
        redirectToLogin();
        throw new ApiError(40100, 'Session expired, please login again');
      } finally {
        isRefreshing = false;
      }
    }

    // 非 token 问题的 401（如 EMAIL_NOT_VERIFIED），直接抛出
    throw new ApiError(code || 40100, body.message || 'Unauthorized');
  }

  const json = await res.json();

  if (!res.ok) {
    throw new ApiError(json.code || 50000, json.message || 'Request failed');
  }

  return json;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
