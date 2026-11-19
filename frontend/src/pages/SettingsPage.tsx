import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { KeyRound, Save, Volume2 } from 'lucide-react';
import { api } from '@/services/api';
import { applyTheme, useSettingsStore } from '@/stores/settings';
import { toast } from '@/stores/ui';
import { useSpeak } from '@/hooks/useSpeech';
import { PageHeader, PageLoader } from '@/components/ui';
import { Button } from '@/components/ui/Button';

interface SettingsDto {
  theme: 'dark' | 'light' | 'system';
  dailyGoalXp: number;
  soundVolume: number;
  musicVolume: number;
  muted: boolean;
  speechRate: number;
  voiceAccent: 'en-US' | 'en-GB' | 'en-AU';
  emailNotifications: boolean;
  pushNotifications: boolean;
  showOnLeaderboard: boolean;
  reducedMotion: boolean;
}

export function SettingsPage() {
  const store = useSettingsStore();
  const { say } = useSpeak();
  const [form, setForm] = useState<SettingsDto | null>(null);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<{ settings: SettingsDto }>('/users/me/settings'),
  });

  useEffect(() => {
    if (data?.settings) setForm(data.settings);
  }, [data]);

  const saveMut = useMutation({
    mutationFn: (payload: SettingsDto) => api.patch<{ settings: SettingsDto }>('/users/me/settings', payload),
    onSuccess: (res) => {
      store.apply(res.settings);
      applyTheme(res.settings.theme, res.settings.reducedMotion);
      toast.success('Settings saved!');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const pwMut = useMutation({
    mutationFn: () => api.post('/auth/change-password', pw),
    onSuccess: () => {
      setPw({ currentPassword: '', newPassword: '' });
      toast.success('Password updated!');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (isLoading || !form) return <PageLoader />;

  const saveSettings = (e: FormEvent) => {
    e.preventDefault();
    saveMut.mutate(form);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow="Preferences" title="Settings & Audio Controls" subtitle="Personalize your daily XP goal, voice accent, game sound volumes, theme, and privacy." />

      <form onSubmit={saveSettings} className="panel space-y-6 p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Theme</label>
            <select className="input" value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value as SettingsDto['theme'] })}>
              <option value="dark">Midnight Navy (Dark)</option>
              <option value="light">Clean Daylight (Light)</option>
              <option value="system">System Preference</option>
            </select>
          </div>
          <div>
            <label className="label">Daily XP Goal ({form.dailyGoalXp} XP)</label>
            <input type="range" min={20} max={250} step={10} value={form.dailyGoalXp} onChange={(e) => setForm({ ...form, dailyGoalXp: Number(e.target.value) })} className="mt-3 w-full accent-cyan" />
          </div>
        </div>

        <div className="border-t border-line/60 pt-5">
          <h2 className="mb-3 font-bold">Audio, Music & Speech</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Pronunciation Voice Accent</label>
              <select className="input" value={form.voiceAccent} onChange={(e) => setForm({ ...form, voiceAccent: e.target.value as SettingsDto['voiceAccent'] })}>
                <option value="en-US">American English (en-US)</option>
                <option value="en-GB">British English (en-GB)</option>
                <option value="en-AU">Australian English (en-AU)</option>
              </select>
            </div>
            <div>
              <label className="label">Speech Speed ({form.speechRate.toFixed(2)}x)</label>
              <div className="flex items-center gap-3">
                <input type="range" min={0.6} max={1.3} step={0.05} value={form.speechRate} onChange={(e) => setForm({ ...form, speechRate: Number(e.target.value) })} className="w-full accent-cyan" />
                <button
                  type="button"
                  onClick={() => {
                    store.apply(form);
                    say('Welcome to Future English Center!');
                  }}
                  className="rounded-xl bg-surface-2 p-2 text-cyan"
                  title="Test voice"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="label">Game Sound Effects ({Math.round(form.soundVolume * 100)}%)</label>
              <input type="range" min={0} max={1} step={0.05} value={form.soundVolume} onChange={(e) => setForm({ ...form, soundVolume: Number(e.target.value) })} className="w-full accent-cyan" />
            </div>
            <div>
              <label className="label">Background Music ({Math.round(form.musicVolume * 100)}%)</label>
              <input type="range" min={0} max={1} step={0.05} value={form.musicVolume} onChange={(e) => setForm({ ...form, musicVolume: Number(e.target.value) })} className="w-full accent-cyan" />
            </div>
          </div>
        </div>

        <div className="space-y-2.5 border-t border-line/60 pt-5 text-sm">
          <label className="flex items-center gap-2.5">
            <input type="checkbox" checked={form.muted} onChange={(e) => setForm({ ...form, muted: e.target.checked })} className="h-4 w-4 accent-cyan" />
            Mute all audio & speech
          </label>
          <label className="flex items-center gap-2.5">
            <input type="checkbox" checked={form.showOnLeaderboard} onChange={(e) => setForm({ ...form, showOnLeaderboard: e.target.checked })} className="h-4 w-4 accent-cyan" />
            Show my profile on the public leaderboard
          </label>
          <label className="flex items-center gap-2.5">
            <input type="checkbox" checked={form.reducedMotion} onChange={(e) => setForm({ ...form, reducedMotion: e.target.checked })} className="h-4 w-4 accent-cyan" />
            Reduce animations & motion
          </label>
        </div>

        <Button type="submit" loading={saveMut.isPending} icon={<Save className="h-4 w-4" />}>
          Save All Preferences
        </Button>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          pwMut.mutate();
        }}
        className="panel space-y-4 p-6 sm:p-8"
      >
        <h2 className="font-bold">Security — Change Password</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" required value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
          </div>
        </div>
        <Button type="submit" variant="secondary" loading={pwMut.isPending} icon={<KeyRound className="h-4 w-4" />}>
          Update Password
        </Button>
      </form>
    </div>
  );
}
