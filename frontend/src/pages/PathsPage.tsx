import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Clock, Compass, Play, Route } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/stores/auth';
import { toast } from '@/stores/ui';
import { ErrorState, PageHeader, PageLoader } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/Progress';

interface PathDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  audience: string;
  color: string;
  enrolled: boolean;
  completedSteps: number;
  totalSteps: number;
  percent: number;
  steps: {
    id: string;
    order: number;
    unit: string;
    completed: boolean;
    lesson: { id: string; slug: string; title: string; level: string; durationMin: number; xpReward: number; emoji?: string };
  }[];
}

export function PathsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['paths'],
    queryFn: () => api.get<{ paths: PathDto[] }>('/learning/paths'),
  });

  const enrollMut = useMutation({
    mutationFn: (pathId: string) => api.post(`/learning/paths/${pathId}/enroll`),
    onSuccess: () => {
      toast.success('Enrolled in Learning Path!');
      void qc.invalidateQueries({ queryKey: ['paths'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (isLoading) return <PageLoader />;
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div>
      <PageHeader
        eyebrow="Structured Pathways"
        title="Guided English Learning Paths"
        subtitle="Follow step-by-step roadmaps designed specifically for SMP, SMA, SMK Vocational, and General English learners."
      />

      <div className="space-y-8">
        {data.paths.map((p) => {
          const nextStep = p.steps.find((s) => !s.completed) ?? p.steps[0];
          return (
            <section key={p.id} className="panel overflow-hidden">
              <div className="border-b border-line/70 p-6 sm:p-8" style={{ background: `linear-gradient(120deg, ${p.color}18 0%, transparent 65%)` }}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                      <span className="chip" style={{ color: p.color, borderColor: `${p.color}55` }}>
                        <Route className="h-3.5 w-3.5" /> {p.audience} Track
                      </span>
                      <span className="chip">{p.level}</span>
                      {p.enrolled && <span className="chip border-success/40 bg-success/10 text-success">Enrolled</span>}
                    </div>
                    <h2 className="mt-3 text-2xl font-bold">{p.title}</h2>
                    <p className="mt-1.5 max-w-2xl text-sm text-muted">{p.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {user && !p.enrolled && (
                      <Button variant="secondary" loading={enrollMut.isPending} onClick={() => enrollMut.mutate(p.id)} icon={<Compass className="h-4 w-4" />}>
                        Follow Path
                      </Button>
                    )}
                    {nextStep && (
                      <Link
                        to={`/learn/lesson/${nextStep.lesson.slug}`}
                        className="inline-flex items-center gap-2 rounded-2xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-glow"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        {p.completedSteps > 0 ? 'Continue Next Step' : 'Start Path'}
                      </Link>
                    )}
                  </div>
                </div>

                <div className="mt-5 max-w-md">
                  <div className="mb-1.5 flex justify-between text-xs font-bold">
                    <span>
                      {p.completedSteps} / {p.totalSteps} milestones completed
                    </span>
                    <span style={{ color: p.color }}>{p.percent}%</span>
                  </div>
                  <ProgressBar value={p.percent} color={p.color} />
                </div>
              </div>

              <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
                {p.steps.map((step) => (
                  <Link
                    key={step.id}
                    to={`/learn/lesson/${step.lesson.slug}`}
                    className={`flex items-start gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5 ${
                      step.completed ? 'border-success/40 bg-success/5' : 'border-line bg-surface-2/40 hover:border-cyan/60'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                    ) : (
                      <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
                    )}
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                        Step {step.order} · {step.unit}
                      </span>
                      <p className="mt-0.5 font-bold">
                        {step.lesson.emoji ?? '📘'} {step.lesson.title}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                        <Clock className="h-3 w-3" /> {step.lesson.durationMin}m · +{step.lesson.xpReward} XP
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
