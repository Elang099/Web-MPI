import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft, Coins, Flame, Shirt, Volume2, VolumeX, Zap } from 'lucide-react';
import { useAuth } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import { api } from '@/services/api';

/**
 * Game Center Layout — distinctly vibrant, playful arcade aesthetic
 * while staying synchronized with the learner's XP, coins, streak, and audio settings.
 */
export function GameLayout() {
  const { user } = useAuth();
  const { muted, apply } = useSettingsStore();

  const toggleMute = () => {
    const next = !muted;
    apply({ muted: next });
    if (user) void api.patch('/users/me/settings', { muted: next }).catch(() => undefined);
  };

  return (
    <div className="min-h-screen bg-[#0D1336] font-game text-white relative overflow-x-hidden">
      {/* Dynamic colorful sky / arcade backdrop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-game-sky/20 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-game-candy/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-game-grape/25 blur-3xl" />
      </div>

      {/* Game HUD Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0F2D]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Main Website</span>
            </Link>
            <Link to="/games" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-game-candy to-game-grape text-lg shadow-game">
                🎮
              </span>
              <span className="leading-tight">
                <span className="block text-base font-extrabold tracking-wide text-white">GAME CENTER</span>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-game-sky">Future English Arcade</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {user && (
              <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs sm:text-sm font-extrabold">
                <span className="flex items-center gap-1 text-game-orange">
                  <Flame className="h-4 w-4" />
                  {user.stats.streak}
                </span>
                <span className="text-white/20">|</span>
                <span className="flex items-center gap-1 text-game-sky">
                  <Zap className="h-4 w-4" />
                  {user.stats.xp}
                </span>
                <span className="text-white/20">|</span>
                <span className="flex items-center gap-1 text-game-sun">
                  <Coins className="h-4 w-4" />
                  {user.stats.coins}
                </span>
              </div>
            )}

            <Link
              to="/games/avatar"
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-game-grape to-game-candy px-3.5 py-2 text-xs sm:text-sm font-extrabold text-white shadow-game hover:brightness-110"
            >
              <Shirt className="h-4 w-4" />
              <span className="hidden sm:inline">Avatar</span>
            </Link>

            <button
              onClick={toggleMute}
              aria-label={muted ? 'Unmute game audio' : 'Mute game audio'}
              className="rounded-2xl border border-white/15 bg-white/10 p-2 text-white hover:bg-white/20"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
