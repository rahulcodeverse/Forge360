import { useAuthStore } from '@/stores/auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

interface ApiError extends Error {
  status: number;
  code: string;
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, params, ...init } = options;

  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');

  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const tenantId = getTenantId();
  if (tenantId) headers.set('X-Tenant-ID', tenantId);

  const requestInit: RequestInit = {
    ...init,
    headers,
    credentials: 'include',
  };
  if (body !== undefined) requestInit.body = JSON.stringify(body);

  const response = await fetch(buildUrl(path, params), requestInit);

  if (!response.ok) {
    const errData = (await response.json().catch(() => ({}))) as {
      error?: { code?: string; message?: string };
    };
    const err = new Error(errData.error?.message ?? `HTTP ${response.status}`) as ApiError;
    err.status = response.status;
    err.code = errData.error?.code ?? 'UNKNOWN';

    if (response.status === 401) {
      const refreshed = await tryRefreshToken();
      if (refreshed) return request<T>(path, options);
    }

    throw err;
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, params?: RequestOptions['params']) => {
    const options: RequestOptions = { method: 'GET' };
    if (params !== undefined) options.params = params;
    return request<T>(path, options);
  },
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return useAuthStore.getState().accessToken ?? sessionStorage.getItem('hrms_at');
}

function getTenantId(): string | null {
  if (typeof window === 'undefined') return null;
  return useAuthStore.getState().tenantId ?? localStorage.getItem('hrms_tid');
}

let isRefreshing = false;
async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing) return false;
  isRefreshing = true;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { data: { accessToken: string } };
    const tenantId = getTenantId();
    if (tenantId) useAuthStore.getState().setSession(data.data.accessToken, tenantId);
    else sessionStorage.setItem('hrms_at', data.data.accessToken);
    return true;
  } catch {
    return false;
  } finally {
    isRefreshing = false;
  }
}
