import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AUDIENCES, CEFR, type AuthUser } from '@fec/shared';
import { Award, Check, Flame, GraduationCap, Shirt, Zap } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/stores/auth';
import { toast } from '@/stores/ui';
import { ErrorState, PageHeader, PageLoader } from '@/components/ui';
import { Button, ButtonLink } from '@/components/ui/Button';
import { AvatarRenderer, type AvatarConfig } from '@/games/AvatarRenderer';

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    displayName: user?.displayName ?? '',
    bio: user?.profile?.bio ?? '',
    audience: user?.profile?.audience ?? 'GENERAL',
    cefr: user?.profile?.cefr ?? '',
    goal: user?.profile?.goal ?? '',
    careerField: user?.profile?.careerField ?? '',
    isPublic: user?.profile?.isPublic ?? true,
  });

  const { data: avatarData } = useQuery({
    queryKey: ['avatar'],
    queryFn: () => api.get<{ avatar: AvatarConfig }>('/avatar'),
    enabled: !!user,
  });

  const saveMut = useMutation({
    mutationFn: () =>
      api.patch<{ user: AuthUser }>('/users/me/profile', {
        ...form,
        cefr: form.cefr || undefined,
      }),
    onSuccess: (res) => {
      setUser(res.user);
      toast.success('Profile updated!');
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveMut.mutate();
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Learner Profile"
        title={user.displayName}
        subtitle={`@${user.username} · ${user.role} · Joined ${new Date(user.createdAt).toLocaleDateString()}`}
        actions={
          <ButtonLink to="/games/avatar" variant="secondary" icon={<Shirt className="h-4 w-4" />}>
            Customize Avatar
          </ButtonLink>
        }
      />

      <div className="grid gap-6 md:grid-cols-12">
        <div className="panel flex flex-col items-center p-6 text-center md:col-span-4">
          <AvatarRenderer avatar={avatarData?.avatar} size={160} pose="idle" />
          <p className="mt-2 font-bold">{avatarData?.avatar?.name ?? user.displayName}</p>
          <p className="text-xs text-cyan">
            Level {user.stats.level} · {user.profile?.cefr ? `CEFR ${user.profile.cefr}` : 'Unassessed'}
          </p>

          <div className="mt-5 grid w-full grid-cols-2 gap-2 text-xs font-bold">
            <div className="rounded-2xl bg-surface-2/60 p-3">
              <Zap className="mx-auto mb-1 h-4 w-4 text-cyan" />
              {user.stats.xp} XP
            </div>
            <div className="rounded-2xl bg-surface-2/60 p-3">
              <Flame className="mx-auto mb-1 h-4 w-4 text-orange-400" />
              {user.stats.streak}d Streak
            </div>
          </div>

          <Link to="/certificates" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-cyan hover:underline">
            <GraduationCap className="h-4 w-4" /> View My Certificates →
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="panel space-y-4 p-6 md:col-span-8">
          <h2 className="text-lg font-bold">Edit Profile Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Display Name</label>
              <input className="input" required value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
            </div>
            <div>
              <label className="label">Learning Track</label>
              <select className="input" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as never })}>
                {AUDIENCES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">CEFR Level</label>
              <select className="input" value={form.cefr} onChange={(e) => setForm({ ...form, cefr: e.target.value })}>
                <option value="">Not set (take Placement Test)</option>
                {CEFR.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Career Focus</label>
              <input className="input" value={form.careerField} onChange={(e) => setForm({ ...form, careerField: e.target.value })} placeholder="e.g. Software Engineering, Hospitality" />
            </div>
          </div>

          <div>
            <label className="label">English Learning Goal</label>
            <input className="input" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="Speak confidently in interviews & read technical docs" />
          </div>

          <div>
            <label className="label">Short Bio</label>
            <textarea rows={3} className="input" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell the community about your English journey..." />
          </div>

          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} className="h-4 w-4 accent-cyan" />
            Allow other learners to view my public profile & achievements
          </label>

          <Button type="submit" loading={saveMut.isPending} icon={<Check className="h-4 w-4" />}>
            Save Profile
          </Button>
        </form>
      </div>
    </div>
  );
}

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['public-profile', username],
    queryFn: () =>
      api.get<{
        user: {
          displayName: string;
          username: string;
          bio: string | null;
          cefr: string | null;
          level: number;
          xp: number;
          streak: number;
          avatar: AvatarConfig | null;
          achievements: { slug: string; title: string }[];
        };
      }>(`/users/${username}`),
  });

  if (isLoading) return <PageLoader />;
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;
  const u = data.user;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="panel flex flex-col items-center p-8 text-center">
        <AvatarRenderer avatar={u.avatar} size={150} pose="celebrate" />
        <h1 className="mt-2 text-2xl font-bold">{u.displayName}</h1>
        <p className="text-sm text-cyan">
          @{u.username} · Lv.{u.level} {u.cefr ? `· CEFR ${u.cefr}` : ''}
        </p>
        {u.bio && <p className="mt-3 max-w-md text-sm text-muted">{u.bio}</p>}
        <div className="mt-6 flex gap-6 text-sm font-bold">
          <span>⚡ {u.xp.toLocaleString()} XP</span>
          <span>🔥 {u.streak}d Streak</span>
        </div>
      </div>

      <div className="panel p-6">
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <Award className="h-5 w-5 text-neon" /> Recent Badges
        </h2>
        <div className="flex flex-wrap gap-2">
          {u.achievements.map((a) => (
            <span key={a.slug} className="chip">
              🏅 {a.title}
            </span>
          ))}
          {u.achievements.length === 0 && <p className="text-sm text-muted">No achievements shared yet.</p>}
        </div>
      </div>
    </div>
  );
}
