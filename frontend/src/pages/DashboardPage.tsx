import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CATEGORY_META, GAME_META, type Category, type GameSlug, type RewardSummary } from '@fec/shared';
import { ArrowRight, Award, BookOpen, Bot, CheckCircle2, Flame, Gamepad2, Play, Route, Sparkles, Target, Trophy, Zap } from 'lucide-react';
import { api } from '@/services/api';
import { celebrate, toast } from '@/stores/ui';
import { ErrorState, PageLoader } from '@/components/ui';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ProgressBar, ProgressRing } from '@/components/ui/Progress';

interface DashboardData {
  user: { displayName: string; profile: { audience: string; cefr: string | null } | null };
  dailyGoal: { current: number; target: number; percent: number };
  levelProgress: { level: number; current: number; required: number; percent: number };
  stats: { xp: number; level: number; coins: number; streak: number; longestStreak: number; lessonsCompleted: number; lessonsTotal: number };
  continueLesson: { slug: string; title: string; summary: string; level: string; durationMin: number; emoji?: string; topic: { title: string; category: Category } } | null;
  recommendedLessons: { id: string; slug: string; title: string; summary: string; level: string; durationMin: number; xpReward: number; emoji?: string; topic: { title: string; category: Category } }[];
  weakestSkills: { skill: string; accuracy: number; attempts: number }[];
  skills: { skill: string; accuracy: number; attempts: number; activities: number }[];
  weekly: { date: string; label: string; xp: number }[];
  recentActivities: { id: string; type: string; title: string; xp: number; createdAt: string }[];
  missions: { id: string; title: string; description: string; period: string; progress: number; target: number; completed: boolean; claimed: boolean; xpReward: number; coinReward: number }[];
  paths: { id: string; slug: string; title: string; level: string; color: string; enrolled: boolean; completedSteps: number; totalSteps: number; percent: number }[];
  achievements: { earnedCount: number; totalCount: number; recent: { slug: string; title: string; description: string; rarity: string }[] };
  challenges: { id: string; title: string; description: string; target: number; xpReward: number }[];
}

export function DashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardData>('/progress/dashboard'),
  });

  const claimMut = useMutation({
    mutationFn: (missionId: string) => api.post<{ reward: RewardSummary }>(`/progress/missions/${missionId}/claim`),
    onSuccess: (res) => {
      celebrate(res.reward, 'Mission Claimed!');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (isLoading) return <PageLoader />;
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const maxWeekXp = Math.max(50, ...data.weekly.map((w) => w.xp));

  return (
    <div className="space-y-8">
      {/* 1. Personalized Welcome + Continue Learning + Daily Goal Composition */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="panel relative overflow-hidden border-cyan/35 bg-gradient-to-br from-navy-900/90 via-surface to-surface p-6 sm:p-8 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="eyebrow">
                {data.user.profile?.audience ?? 'GENERAL'} Track · CEFR {data.user.profile?.cefr ?? 'Unassessed'}
              </span>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Welcome back, {data.user.displayName.split(' ')[0]} 👋</h1>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-orange-400/30 bg-orange-500/10 px-3.5 py-2 text-sm font-bold text-orange-400">
              <Flame className="h-4 w-4 fill-orange-400/30" />
              {data.stats.streak} day streak
            </div>
          </div>

          {/* Continue Learning Spotlight */}
          {data.continueLesson && (
            <div className="mt-6 flex flex-col justify-between gap-5 rounded-3xl border border-cyan/30 bg-surface-2/60 p-5 sm:flex-row sm:items-center">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan">
                  <span>{data.continueLesson.emoji ?? '📘'}</span>
                  <span>CONTINUE LEARNING · {CATEGORY_META[data.continueLesson.topic.category]?.label}</span>
                </div>
                <h2 className="text-xl font-bold">{data.continueLesson.title}</h2>
                <p className="max-w-lg text-sm text-muted">{data.continueLesson.summary}</p>
              </div>
              <ButtonLink to={`/learn/lesson/${data.continueLesson.slug}`} icon={<Play className="h-4 w-4 fill-current" />} className="shrink-0">
                Resume Lesson
              </ButtonLink>
            </div>
          )}

          {/* Level & Lesson Progress Strip */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                <span>
                  Level {data.levelProgress.level} Progress ({data.stats.xp} XP)
                </span>
                <span className="text-cyan">
                  {data.levelProgress.current} / {data.levelProgress.required} XP
                </span>
              </div>
              <ProgressBar value={data.levelProgress.percent} />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                <span>Curriculum Mastery</span>
                <span className="text-neon">
                  {data.stats.lessonsCompleted} / {data.stats.lessonsTotal} lessons
                </span>
              </div>
              <ProgressBar value={(data.stats.lessonsCompleted / Math.max(1, data.stats.lessonsTotal)) * 100} color="#A855F7" />
            </div>
          </div>
        </div>

        {/* Daily Goal Ring + Quick Actions */}
        <div className="panel flex flex-col justify-between p-6 lg:col-span-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Daily Goal</p>
              <h2 className="mt-1 text-xl font-bold">
                {data.dailyGoal.current} / {data.dailyGoal.target} XP
              </h2>
            </div>
            <ProgressRing value={data.dailyGoal.percent} size={76} stroke={7}>
              <span className="text-sm font-bold">{data.dailyGoal.percent}%</span>
            </ProgressRing>
          </div>
          <p className="mt-2 text-xs text-muted">
            {data.dailyGoal.percent >= 100 ? 'Goal crushed today! Extra lessons still build mastery.' : 'Complete 1 lesson or play a quick round to hit today’s target.'}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <ButtonLink to="/practice" variant="secondary" size="sm" icon={<Sparkles className="h-4 w-4 text-cyan" />}>
              Quick Practice
            </ButtonLink>
            <ButtonLink to="/ai-tutor" variant="secondary" size="sm" icon={<Bot className="h-4 w-4 text-neon" />}>
              AI Tutor
            </ButtonLink>
            {!data.user.profile?.cefr && (
              <ButtonLink to="/assessments/placement-test" size="sm" className="col-span-2" icon={<Target className="h-4 w-4" />}>
                Take Placement Test (CEFR)
              </ButtonLink>
            )}
          </div>
        </div>
      </section>

      {/* 2. Weekly Learning Chart + Skill Development Overview */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="panel p-6 lg:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="eyebrow">7-Day Momentum</p>
              <h2 className="text-lg font-bold">Weekly Learning Statistics</h2>
            </div>
            <Link to="/progress" className="text-xs font-bold text-cyan hover:underline">
              Full Analytics →
            </Link>
          </div>
          <div className="mt-6 flex h-40 items-end justify-between gap-2">
            {data.weekly.map((day) => {
              const h = Math.max(8, Math.round((day.xp / maxWeekXp) * 100));
              return (
                <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-muted">{day.xp}</span>
                  <div className="flex h-28 w-full items-end rounded-xl bg-surface-2/60 p-1">
                    <div
                      className="w-full rounded-lg bg-brand-gradient transition-all duration-700"
                      style={{ height: `${day.xp === 0 ? 6 : h}%`, opacity: day.xp === 0 ? 0.25 : 1 }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-muted">{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel p-6 lg:col-span-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="eyebrow">Skill Mastery</p>
              <h2 className="text-lg font-bold">7 Core English Skills</h2>
            </div>
            {data.weakestSkills[0] && (
              <Link to={`/practice?skill=${data.weakestSkills[0].skill}`} className="chip border-warning/40 text-warning hover:bg-warning/10">
                Focus suggested: {data.weakestSkills[0].skill} →
              </Link>
            )}
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            {data.skills.map((s) => (
              <div key={s.skill} className="rounded-2xl border border-line/70 bg-surface-2/40 p-3.5">
                <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                  <span>{s.skill}</span>
                  <span className="text-cyan">{s.attempts > 0 ? `${s.accuracy}%` : `${s.activities} sessions`}</span>
                </div>
                <ProgressBar value={s.attempts > 0 ? s.accuracy : Math.min(100, s.activities * 25)} height={6} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Recommended Lessons & Learning Path Progress */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Recommended Lessons</h2>
            <Link to="/learn" className="text-xs font-bold text-cyan hover:underline">
              Explore all 9 categories →
            </Link>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            {data.recommendedLessons.map((lesson) => {
              const meta = CATEGORY_META[lesson.topic.category];
              return (
                <Link key={lesson.id} to={`/learn/lesson/${lesson.slug}`} className="panel panel-hover flex flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span style={{ color: meta?.color }}>{meta?.label}</span>
                      <span className="text-muted">{lesson.durationMin} min</span>
                    </div>
                    <h3 className="mt-2 font-bold">
                      {lesson.emoji ?? '📘'} {lesson.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{lesson.summary}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3 text-xs font-bold">
                    <span className="text-muted">{lesson.level}</span>
                    <span className="text-cyan">+{lesson.xpReward} XP</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="panel p-6 lg:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Route className="h-5 w-5 text-neon" />
              <h2 className="text-lg font-bold">Learning Paths</h2>
            </div>
            <Link to="/paths" className="text-xs font-bold text-cyan hover:underline">
              All paths →
            </Link>
          </div>
          <div className="space-y-4">
            {data.paths.slice(0, 4).map((p) => (
              <Link key={p.id} to="/paths" className="block rounded-2xl border border-line/70 bg-surface-2/40 p-3.5 hover:border-cyan/50">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>{p.title}</span>
                  <span className="text-xs text-cyan">{p.percent}%</span>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {p.completedSteps} / {p.totalSteps} lessons · {p.level}
                </p>
                <ProgressBar value={p.percent} color={p.color} height={6} className="mt-2.5" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Educational Game Center Recommendations Banner */}
      <section className="overflow-hidden rounded-4xl border border-game-grape/40 bg-gradient-to-r from-[#141A4E] via-[#271863] to-[#11194A] p-6 text-white shadow-glow-purple">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 font-game text-xs font-extrabold uppercase tracking-wider text-game-sun">
              <Gamepad2 className="h-4 w-4" /> Game Center Recommendations
            </span>
            <h2 className="mt-1 font-game text-2xl font-black">Practice English inside 5 interactive worlds!</h2>
            <p className="mt-1 text-sm text-white/75">Run through word gates in English Dash or earn building materials for your English City.</p>
          </div>
          <ButtonLink to="/games" className="btn-game bg-gradient-to-r from-game-candy to-game-grape shrink-0">
            Launch Game Center <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {(['english-dash', 'city-builder', 'life-simulator'] as GameSlug[]).map((slug) => {
            const g = GAME_META[slug];
            return (
              <Link
                key={slug}
                to={`/games/${slug}`}
                className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
              >
                <p className="font-game text-base font-extrabold" style={{ color: g.color }}>
                  {g.title}
                </p>
                <p className="mt-1 text-xs text-white/80">{g.tagline}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 5. Missions, Recent Activities, Challenges & Achievements */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="panel p-6 lg:col-span-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Target className="h-5 w-5 text-cyan" /> Daily & Weekly Missions
          </h2>
          <div className="space-y-3">
            {data.missions.slice(0, 5).map((m) => (
              <div key={m.id} className="rounded-2xl border border-line/70 bg-surface-2/40 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">{m.title}</p>
                    <p className="text-xs text-muted">
                      {m.progress}/{m.target} · +{m.xpReward} XP · +{m.coinReward} coins
                    </p>
                  </div>
                  {m.claimed ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-success">
                      <CheckCircle2 className="h-4 w-4" /> Claimed
                    </span>
                  ) : m.completed ? (
                    <Button size="sm" variant="success" onClick={() => claimMut.mutate(m.id)}>
                      Claim
                    </Button>
                  ) : (
                    <span className="chip">{m.period}</span>
                  )}
                </div>
                <ProgressBar value={(m.progress / Math.max(1, m.target)) * 100} height={5} className="mt-2.5" />
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6 lg:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Zap className="h-5 w-5 text-warning" /> Recent Activity
            </h2>
          </div>
          {data.recentActivities.length === 0 ? (
            <p className="text-sm text-muted">Complete a lesson or play a game to see your activity feed here!</p>
          ) : (
            <div className="space-y-2.5">
              {data.recentActivities.slice(0, 6).map((act) => (
                <div key={act.id} className="flex items-center justify-between gap-2 rounded-2xl border border-line/50 bg-surface-2/30 px-3.5 py-2.5 text-xs">
                  <span className="truncate font-medium">{act.title}</span>
                  {act.xp > 0 && <span className="shrink-0 font-bold text-cyan">+{act.xp} XP</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel flex flex-col justify-between p-6 lg:col-span-3">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Award className="h-5 w-5 text-neon" /> Achievements
              </h2>
              <Link to="/achievements" className="text-xs font-bold text-cyan hover:underline">
                View all
              </Link>
            </div>
            <p className="text-2xl font-bold">
              {data.achievements.earnedCount} <span className="text-sm font-normal text-muted">/ {data.achievements.totalCount} unlocked</span>
            </p>
            <div className="mt-4 space-y-2">
              {data.achievements.recent.slice(0, 3).map((a) => (
                <div key={a.slug} className="rounded-xl bg-surface-2/60 px-3 py-2 text-xs font-semibold">
                  🏅 {a.title}
                </div>
              ))}
              {data.achievements.recent.length === 0 && <p className="text-xs text-muted">Complete your first lesson to unlock your first badge!</p>}
            </div>
          </div>

          <div className="mt-6 border-t border-line/60 pt-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-muted">
              <Trophy className="h-4 w-4 text-warning" /> Upcoming Challenges
            </p>
            {data.challenges.slice(0, 2).map((c) => (
              <Link key={c.id} to="/community" className="mt-1.5 block text-xs font-semibold text-cyan hover:underline">
                → {c.title} (+{c.xpReward} XP)
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
