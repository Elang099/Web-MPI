import type { ApiErrorBody, AuthResponse } from '@fec/shared';
import { useAuth } from '@/stores/auth';

/**
 * Fetch wrapper for the FUTURE ENGLISH CENTER API.
 * - Adds the in-memory access token.
 * - On 401, transparently refreshes once via the httpOnly refresh cookie and retries.
 * - Throws ApiError with the server's { code, message }.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

let refreshing: Promise<boolean> | null = null;

export async function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
        if (!res.ok) {
          useAuth.getState().clear();
          return false;
        }
        const data = (await res.json()) as AuthResponse;
        useAuth.getState().setSession(data.accessToken, data.user);
        return true;
      } catch {
        return false;
      } finally {
        setTimeout(() => (refreshing = null), 0);
      }
    })();
  }
  return refreshing;
}

type Options = Omit<RequestInit, 'body'> & { body?: unknown; raw?: boolean };

async function request<T>(path: string, opts: Options = {}, retry = true): Promise<T> {
  const token = useAuth.getState().accessToken;
  const headers = new Headers(opts.headers);
  if (opts.body !== undefined && !(opts.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers,
    credentials: 'include',
    body: opts.body === undefined ? undefined : opts.body instanceof FormData ? opts.body : JSON.stringify(opts.body),
  });

  if (res.status === 401 && retry && !path.startsWith('/auth/')) {
    if (await refreshSession()) return request<T>(path, opts, false);
  }

  if (!res.ok) {
    let body: Partial<ApiErrorBody> = {};
    try {
      body = await res.json();
    } catch {
      /* not json */
    }
    throw new ApiError(res.status, body.error?.code ?? 'HTTP_ERROR', body.error?.message ?? res.statusText, body.error?.details);
  }
  if (opts.raw) return res as unknown as T;
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, opts?: Options) => request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: Options) => request<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: Options) => request<T>(path, { ...opts, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, opts?: Options) => request<T>(path, { ...opts, method: 'PUT', body }),
  delete: <T>(path: string, opts?: Options) => request<T>(path, { ...opts, method: 'DELETE' }),
  /** Downloads a binary endpoint (e.g. PDF) and triggers a browser download. */
  async download(path: string, filename: string) {
    const res = await request<Response>(path, { method: 'GET', raw: true });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
