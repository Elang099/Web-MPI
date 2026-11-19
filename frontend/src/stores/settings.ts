import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ClientSettings {
  theme: 'dark' | 'light' | 'system';
  soundVolume: number;
  musicVolume: number;
  muted: boolean;
  speechRate: number;
  voiceAccent: 'en-US' | 'en-GB' | 'en-AU';
  reducedMotion: boolean;
}

interface SettingsState extends ClientSettings {
  apply: (s: Partial<ClientSettings>) => void;
}

/**
 * Local mirror of the server-side UserSettings that affect the client immediately
 * (theme, audio, speech). Synced from GET /api/users/me/settings after login and
 * persisted locally so anonymous visitors keep their choice too.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      soundVolume: 0.7,
      musicVolume: 0.4,
      muted: false,
      speechRate: 0.95,
      voiceAccent: 'en-US',
      reducedMotion: false,
      apply: (s) => set(s),
    }),
    { name: 'fec-settings' },
  ),
);

export function applyTheme(theme: ClientSettings['theme'], reducedMotion: boolean) {
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.classList.toggle('reduce-motion', reducedMotion);
}
