/**
 * API 请求客户端
 * 封装 fetch，自动处理 JWT Token、JSON 解析、错误抛出
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface RequestOptions extends RequestInit {
  token?: string;
}

/** API 错误类，携带业务错误码 */
class ApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}

/** 通用请求方法 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new ApiError(json.code || 50000, json.message || 'Request failed');
  }

  return json;
}

/** API 请求对象 */
export const api = {
  get: <T>(path: string, token?: string) =>
    request<T>(path, { method: 'GET', token }),
  post: <T>(path: string, body?: unknown, token?: string) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), token }),
  patch: <T>(path: string, body?: unknown, token?: string) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), token }),
  put: <T>(path: string, body?: unknown, token?: string) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body), token }),
  delete: <T>(path: string, token?: string) =>
    request<T>(path, { method: 'DELETE', token }),
};

export { ApiError };
