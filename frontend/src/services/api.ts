import type { ApiErrorBody, AuthResponse } from '@fec/shared';
import { useAuth } from '@/stores/auth';
import { getOfflineSession, handleOfflineRequest, OfflineAuthError } from './offlineApi';

/**
 * Fetch wrapper for the FUTURE ENGLISH CENTER API.
 * - Adds the in-memory access token.
 * - On 401, transparently refreshes once via the httpOnly refresh cookie and retries.
 * - Automatically falls back to Offline / GitHub Pages Demo Mode when no backend is reachable.
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
const isOfflineToken = (t: string | null) => t === 'offline-demo-token' || t === 'demo-token';

let refreshing: Promise<boolean> | null = null;

export async function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
        const ct = res.headers.get('content-type') ?? '';
        if (!res.ok) {
          if (!ct.includes('application/json')) {
            const offlineUser = getOfflineSession();
            if (offlineUser) {
              useAuth.getState().setSession('offline-demo-token', offlineUser);
              return true;
            }
          }
          useAuth.getState().clear();
          return false;
        }
        const data = (await res.json()) as AuthResponse;
        useAuth.getState().setSession(data.accessToken, data.user);
        return true;
      } catch {
        const offlineUser = getOfflineSession();
        if (offlineUser) {
          useAuth.getState().setSession('offline-demo-token', offlineUser);
          return true;
        }
        return false;
      } finally {
        setTimeout(() => (refreshing = null), 0);
      }
    })();
  }
  return refreshing;
}

type Options = Omit<RequestInit, 'body'> & { body?: unknown; raw?: boolean };

function runOffline<T>(method: string, path: string, body?: unknown): T {
  try {
    return handleOfflineRequest<T>(method, path, body);
  } catch (err) {
    if (err instanceof OfflineAuthError) {
      throw new ApiError(err.status, err.code, err.message);
    }
    throw err;
  }
}

async function request<T>(path: string, opts: Options = {}, retry = true): Promise<T> {
  const method = (opts.method ?? 'GET').toUpperCase();
  const token = useAuth.getState().accessToken;

  if (isOfflineToken(token) && !path.startsWith('/auth/login') && !path.startsWith('/auth/register')) {
    return runOffline<T>(method, path, opts.body);
  }

  const headers = new Headers(opts.headers);
  if (opts.body !== undefined && !(opts.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...opts,
      headers,
      credentials: 'include',
      body: opts.body === undefined ? undefined : opts.body instanceof FormData ? opts.body : JSON.stringify(opts.body),
    });
  } catch {
    return runOffline<T>(method, path, opts.body);
  }

  const ct = res.headers.get('content-type') ?? '';
  if (!res.ok && !ct.includes('application/json') && [404, 405, 502, 503, 504].includes(res.status)) {
    return runOffline<T>(method, path, opts.body);
  }

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
