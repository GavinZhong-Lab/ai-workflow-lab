/**
 * API 请求客户端
 * 封装 fetch，自动从 Zustand 读取 JWT Token、JSON 解析、错误抛出
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

let getToken: () => string | null = () => null;

/** 注册 token 获取函数（由 Provider 层注入，避免循环依赖） */
export function setTokenGetter(fn: () => string | null) {
  getToken = fn;
}

/** API 错误类，携带业务错误码 */
export class ApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}

/** 通用请求方法 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  const json = await res.json();

  if (!res.ok) {
    throw new ApiError(json.code || 50000, json.message || 'Request failed');
  }

  return json;
}

/** API 请求对象 */
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
