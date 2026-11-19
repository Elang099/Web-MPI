import { create } from 'zustand';
import type { RewardSummary } from '@fec/shared';
import { useAuth } from './auth';
import { queryClient } from '@/services/queryClient';

interface Toast {
  id: number;
  kind: 'success' | 'error' | 'info' | 'reward';
  title: string;
  body?: string;
  reward?: RewardSummary;
}

interface UiState {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
  /** Level-up / achievement celebration modal */
  celebration: RewardSummary | null;
  setCelebration: (r: RewardSummary | null) => void;
}

let nextId = 1;

export const useUi = create<UiState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = nextId++;
    set({ toasts: [...get().toasts, { ...t, id }] });
    setTimeout(() => get().dismiss(id), t.kind === 'reward' ? 4500 : 3500);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  celebration: null,
  setCelebration: (celebration) => set({ celebration }),
}));

export const toast = {
  success: (title: string, body?: string) => useUi.getState().push({ kind: 'success', title, body }),
  error: (title: string, body?: string) => useUi.getState().push({ kind: 'error', title, body }),
  info: (title: string, body?: string) => useUi.getState().push({ kind: 'info', title, body }),
};

/**
 * Call after ANY API response containing a RewardSummary.
 * Shows the XP toast, triggers the celebration modal on level-up/achievements,
 * and refreshes cached user stats.
 */
export function celebrate(reward: RewardSummary | null | undefined, label = 'Nice work!') {
  if (!reward || reward.duplicate) return;
  if (reward.xp > 0 || reward.coins > 0) useUi.getState().push({ kind: 'reward', title: label, reward });
  if (reward.leveledUp || reward.achievements.length) useUi.getState().setCelebration(reward);
  // Stats changed server-side → refresh /auth/me and dashboards.
  void queryClient.invalidateQueries({ queryKey: ['me'] });
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  void queryClient.invalidateQueries({ queryKey: ['missions'] });
  const u = useAuth.getState().user;
  if (u) useAuth.getState().patchStats({ xp: u.stats.xp + reward.xp, coins: u.stats.coins + reward.coins, level: Math.max(u.stats.level, reward.newLevel) });
}
