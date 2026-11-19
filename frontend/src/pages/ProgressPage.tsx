import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, BookOpen, Download, Gamepad2, TrendingUp } from 'lucide-react';
import { api } from '@/services/api';
import { ErrorState, PageHeader, PageLoader } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/Progress';

interface AnalyticsPayload {
  stats: { xp: number; level: number; coins: number; streak: number; longestStreak: number; learningMinutes: number };
  skills: { skill: string; correct: number; attempts: number; activities: number; accuracy: number }[];
  weakSkills: string[];
  vocabulary: { total: number; mastered: number; reviewed: number };
  attempts: { id: string; score: number; total: number; createdAt: string; exercise: { title: string; skill: string } }[];
  gameSessions: { id: string; gameSlug: string; score: number; correct: number; xpAwarded: number; startedAt: string }[];
  lessonProgress: { id: string; status: string; bestScore: number; lesson: { slug: string; title: string; level: string } }[];
  recommendations: { id: string; slug: string; title: string; summary: string; level: string; emoji?: string }[];
}

export function ProgressPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get<AnalyticsPayload>('/progress/analytics'),
  });

  if (isLoading) return <PageLoader />;
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Learning Analytics"
        title="Your English Mastery & Insights"
        subtitle="Track lesson completion, skill accuracy, vocabulary growth, game performance, and personalized recommendations."
        actions={
          <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={() => void api.download('/assessments/me/report/pdf', 'future-english-report.pdf')}>
            Download PDF Report
          </Button>
        }
      />

      {/* High-level Highlights */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="panel p-5">
          <p className="text-xs font-semibold text-muted">Total XP & Level</p>
          <p className="mt-1 text-2xl font-bold text-cyan">
            Lv.{data.stats.level} · {data.stats.xp.toLocaleString()} XP
          </p>
        </div>
        <div className="panel p-5">
          <p className="text-xs font-semibold text-muted">Vocabulary Mastered</p>
          <p className="mt-1 text-2xl font-bold text-neon">
            {data.vocabulary.mastered} <span className="text-sm font-normal text-muted">/ {data.vocabulary.total}</span>
          </p>
        </div>
        <div className="panel p-5">
          <p className="text-xs font-semibold text-muted">Best Streak</p>
          <p className="mt-1 text-2xl font-bold text-orange-400">{data.stats.longestStreak} days 🔥</p>
        </div>
        <div className="panel p-5">
          <p className="text-xs font-semibold text-muted">Study Time Logged</p>
          <p className="mt-1 text-2xl font-bold text-success">{data.stats.learningMinutes} min</p>
        </div>
      </div>

      {/* Skill Breakdown + Weak Area Focus */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="panel p-6 lg:col-span-7">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <TrendingUp className="h-5 w-5 text-cyan" /> Skill Accuracy Breakdown
          </h2>
          <div className="space-y-4">
            {data.skills.map((s) => (
              <div key={s.skill}>
                <div className="mb-1 flex justify-between text-xs font-bold">
                  <span>{s.skill}</span>
                  <span className="text-muted">
                    {s.attempts > 0 ? `${s.accuracy}% (${s.correct}/${s.attempts})` : `${s.activities} practice logs`}
                  </span>
                </div>
                <ProgressBar value={s.attempts > 0 ? s.accuracy : Math.min(100, s.activities * 25)} color={s.accuracy < 65 && s.attempts > 0 ? '#F59E0B' : undefined} />
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-6 lg:col-span-5">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
            <AlertCircle className="h-5 w-5 text-warning" /> Recommended Next Steps
          </h2>
          <p className="mb-4 text-xs text-muted">
            {data.weakSkills.length > 0 ? `Focus recommended in: ${data.weakSkills.slice(0, 3).join(', ')}` : 'Great balance across all skills! Keep going:'}
          </p>
          <div className="space-y-2.5">
            {data.recommendations.slice(0, 4).map((r) => (
              <Link key={r.id} to={`/learn/lesson/${r.slug}`} className="block rounded-2xl border border-line bg-surface-2/40 p-3.5 hover:border-cyan/60">
                <p className="text-sm font-bold">
                  {r.emoji ?? '📘'} {r.title}
                </p>
                <p className="mt-0.5 text-xs text-muted line-clamp-1">{r.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Recent Exercises & Games */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <BookOpen className="h-5 w-5 text-cyan" /> Recent Exercise Attempts
          </h2>
          {data.attempts.length === 0 ? (
            <p className="text-sm text-muted">No exercise attempts recorded yet.</p>
          ) : (
            <div className="space-y-2.5">
              {data.attempts.slice(0, 8).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-2xl border border-line/60 bg-surface-2/30 px-4 py-2.5 text-sm">
                  <div>
                    <p className="font-semibold">{a.exercise.title}</p>
                    <p className="text-xs text-muted">{a.exercise.skill}</p>
                  </div>
                  <span className="font-bold text-cyan">
                    {a.score}/{a.total}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Gamepad2 className="h-5 w-5 text-neon" /> Recent Game Sessions
          </h2>
          {data.gameSessions.length === 0 ? (
            <p className="text-sm text-muted">Play games in the Game Center to log scores and XP here!</p>
          ) : (
            <div className="space-y-2.5">
              {data.gameSessions.slice(0, 8).map((g) => (
                <div key={g.id} className="flex items-center justify-between rounded-2xl border border-line/60 bg-surface-2/30 px-4 py-2.5 text-sm">
                  <div>
                    <p className="font-semibold capitalize">{g.gameSlug.replace(/-/g, ' ')}</p>
                    <p className="text-xs text-muted">Score {g.score} · {g.correct} English solved</p>
                  </div>
                  <span className="font-bold text-success">+{g.xpAwarded} XP</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
