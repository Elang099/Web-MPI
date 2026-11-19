import { create } from 'zustand';
import type { AuthUser, PlayerStatsDTO } from '@fec/shared';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  /** true once the initial silent refresh has been attempted */
  ready: boolean;
  setSession: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  patchStats: (stats: Partial<PlayerStatsDTO>) => void;
  clear: () => void;
  setReady: () => void;
}

/** Access token lives in memory only; the refresh token is an httpOnly cookie. */
export const useAuth = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  ready: false,
  setSession: (accessToken, user) => set({ accessToken, user }),
  setUser: (user) => set({ user }),
  patchStats: (stats) => set((s) => (s.user ? { user: { ...s.user, stats: { ...s.user.stats, ...stats } } } : s)),
  clear: () => set({ accessToken: null, user: null }),
  setReady: () => set({ ready: true }),
}));
