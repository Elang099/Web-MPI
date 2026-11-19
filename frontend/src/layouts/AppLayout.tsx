import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Compass,
  Flame,
  Gamepad2,
  GraduationCap,
  Home,
  Library,
  LogOut,
  Menu,
  Moon,
  Route,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Trophy,
  User,
  Users,
  Volume2,
  VolumeX,
  X,
  Zap,
  Coins,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/stores/auth';
import { useSettingsStore, applyTheme } from '@/stores/settings';
import { api } from '@/services/api';

const PRIMARY_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/learn', label: 'Learn', icon: BookOpen },
  { to: '/paths', label: 'Paths', icon: Route },
  { to: '/practice', label: 'Practice', icon: Sparkles },
  { to: '/games', label: 'Game Center', icon: Gamepad2, highlight: true },
  { to: '/ai-tutor', label: 'AI Tutor', icon: Bot },
];

const MORE_NAV = [
  { to: '/vocabulary', label: 'Vocabulary Lab', icon: Compass },
  { to: '/assessments', label: 'Assessments & Career', icon: GraduationCap },
  { to: '/progress', label: 'Learning Progress', icon: BarChart3 },
  { to: '/achievements', label: 'Achievements', icon: Award },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/community', label: 'Community & Challenges', icon: Users },
  { to: '/resources', label: 'Resources Library', icon: Library },
  { to: '/certificates', label: 'Certificates', icon: GraduationCap },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppLayout() {
  const { user, clear } = useAuth();
  const { theme, muted, reducedMotion, apply } = useSettingsStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const { data: notifData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => api.get<{ unreadCount: number }>('/notifications'),
    enabled: !!user,
    staleTime: 60_000,
  });

  const unread = notifData?.unreadCount ?? 0;

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    apply({ theme: next });
    applyTheme(next, reducedMotion);
    if (user) void api.patch('/users/me/settings', { theme: next }).catch(() => undefined);
  };

  const toggleMute = () => {
    const next = !muted;
    apply({ muted: next });
    if (user) void api.patch('/users/me/settings', { muted: next }).catch(() => undefined);
  };

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => undefined);
    clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open menu"
              className="rounded-xl p-2 text-muted hover:bg-surface-2 hover:text-ink lg:hidden"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <Logo to={user ? '/dashboard' : '/'} />
          </div>

          {/* Desktop primary nav */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition',
                      item.highlight
                        ? isActive
                          ? 'bg-gradient-to-r from-game-candy to-game-grape text-white shadow-glow-purple'
                          : 'bg-surface-2/80 text-cyan hover:bg-gradient-to-r hover:from-game-candy hover:to-game-grape hover:text-white'
                        : isActive
                          ? 'bg-cyan/15 text-cyan'
                          : 'text-muted hover:bg-surface-2/70 hover:text-ink',
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {user && (
              <div className="hidden items-center gap-2.5 rounded-2xl border border-line/80 bg-surface-2/60 px-3 py-1.5 text-xs font-bold sm:flex">
                <span className="flex items-center gap-1 text-orange-400" title="Daily Streak">
                  <Flame className="h-4 w-4 fill-orange-400/30" />
                  {user.stats.streak}
                </span>
                <span className="h-3.5 w-px bg-line" />
                <span className="flex items-center gap-1 text-cyan" title="Total XP">
                  <Zap className="h-4 w-4" />
                  {user.stats.xp} XP
                </span>
                <span className="h-3.5 w-px bg-line" />
                <span className="flex items-center gap-1 text-warning" title="Coins">
                  <Coins className="h-4 w-4" />
                  {user.stats.coins}
                </span>
              </div>
            )}

            <button
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
              onClick={toggleMute}
              className="rounded-xl p-2 text-muted hover:bg-surface-2 hover:text-ink"
              title={muted ? 'Unmute audio' : 'Mute audio'}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <button
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="rounded-xl p-2 text-muted hover:bg-surface-2 hover:text-ink"
              title="Switch dark / light theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {user ? (
              <>
                <Link
                  to="/notifications"
                  className="relative rounded-xl p-2 text-muted hover:bg-surface-2 hover:text-ink"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute right-1 top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>
                {(user.role === 'ADMIN' || user.role === 'TEACHER') && (
                  <Link
                    to="/admin"
                    className="hidden items-center gap-1.5 rounded-xl border border-neon/40 bg-neon/10 px-3 py-1.5 text-xs font-bold text-neon sm:flex"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="flex items-center gap-2 rounded-2xl border border-line bg-surface-2/80 py-1 pl-1.5 pr-3 text-xs font-bold hover:border-cyan/50"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-xl bg-brand-gradient font-display text-xs text-white">
                    {user.displayName.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="hidden max-w-[110px] truncate md:inline">Lv.{user.stats.level}</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-muted hover:text-ink">
                  Log in
                </Link>
                <Link to="/register" className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-bold text-white shadow-glow">
                  Start Learning
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24 sm:px-6 lg:pb-10">
        <Outlet />
      </main>

      {/* Slide-out Navigation Drawer (All 18 Sections Accessible Cleanly) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="relative z-10 flex h-full w-80 max-w-[85vw] flex-col border-r border-line bg-surface p-5 overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <Logo to={user ? '/dashboard' : '/'} />
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="rounded-xl p-1.5 text-muted hover:bg-surface-2">
                <X className="h-5 w-5" />
              </button>
            </div>

            {user && (
              <div className="mb-5 rounded-2xl border border-line bg-surface-2/60 p-3.5">
                <p className="font-bold">{user.displayName}</p>
                <p className="text-xs text-muted">
                  @{user.username} • Level {user.stats.level} • {user.profile?.cefr ?? 'Unassessed'}
                </p>
              </div>
            )}

            <p className="eyebrow mb-2 px-2">Core</p>
            <div className="space-y-1 mb-5">
              {PRIMARY_NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold',
                        isActive ? 'bg-cyan/15 text-cyan' : 'text-ink/80 hover:bg-surface-2',
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>

            <p className="eyebrow mb-2 px-2">Explore & Account</p>
            <div className="space-y-1 flex-1">
              {MORE_NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium',
                        isActive ? 'bg-cyan/15 text-cyan font-semibold' : 'text-muted hover:bg-surface-2 hover:text-ink',
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
              {(user?.role === 'ADMIN' || user?.role === 'TEACHER') && (
                <NavLink
                  to="/admin"
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold',
                      isActive ? 'bg-neon/20 text-neon' : 'text-neon/80 hover:bg-neon/10',
                    )
                  }
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin Dashboard
                </NavLink>
              )}
            </div>

            {user && (
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  void handleLogout();
                }}
                className="mt-4 flex items-center gap-2 rounded-xl border border-danger/30 px-3 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            )}
          </aside>
        </div>
      )}

      {/* Mobile Bottom Tab Bar */}
      {user && (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line/80 bg-surface/95 backdrop-blur-xl lg:hidden" aria-label="Mobile tabs">
          {[
            { to: '/dashboard', label: 'Home', icon: Home },
            { to: '/learn', label: 'Learn', icon: BookOpen },
            { to: '/games', label: 'Games', icon: Gamepad2 },
            { to: '/ai-tutor', label: 'Tutor', icon: Bot },
            { to: '/progress', label: 'Progress', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  clsx('flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold', isActive ? 'text-cyan' : 'text-muted')
                }
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
}
