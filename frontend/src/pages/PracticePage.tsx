import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LEVELS, SKILLS, type PublicQuestion } from '@fec/shared';
import { RefreshCw, Sparkles } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/stores/auth';
import { celebrate, toast } from '@/stores/ui';
import { ErrorState, PageHeader, PageLoader } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { ExerciseRunner, type GradePayload } from '@/learning/ExerciseRunner';

export function PracticePage() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [skill, setSkill] = useState(params.get('skill') ?? '');
  const [level, setLevel] = useState(params.get('level') ?? '');
  const [seedKey, setSeedKey] = useState(0);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['practice', skill, level, seedKey],
    queryFn: () => {
      const qs = new URLSearchParams({ limit: '8' });
      if (skill) qs.set('skill', skill);
      if (level) qs.set('level', level);
      return api.get<{ questions: PublicQuestion[] }>(`/learning/practice?${qs.toString()}`);
    },
  });

  const applyFilter = (nextSkill: string, nextLevel: string) => {
    setSkill(nextSkill);
    setLevel(nextLevel);
    const next = new URLSearchParams();
    if (nextSkill) next.set('skill', nextSkill);
    if (nextLevel) next.set('level', nextLevel);
    setParams(next);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Interactive Practice"
        title="Targeted Skill Drills"
        subtitle="Choose any English skill and difficulty for a fresh set of interactive questions with instant grading and explanations."
        actions={
          <Button variant="secondary" icon={<RefreshCw className="h-4 w-4" />} onClick={() => setSeedKey((k) => k + 1)}>
            New Question Set
          </Button>
        }
      />

      <div className="panel grid gap-3 p-4 sm:grid-cols-2">
        <div>
          <label className="label text-xs">Focus Skill</label>
          <select className="input py-2.5 text-sm" value={skill} onChange={(e) => applyFilter(e.target.value, level)}>
            <option value="">Mixed Skills (Recommended)</option>
            {SKILLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label text-xs">Difficulty Level</label>
          <select className="input py-2.5 text-sm" value={level} onChange={(e) => applyFilter(skill, e.target.value)}>
            <option value="">All Levels</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : data?.questions.length ? (
        <ExerciseRunner
          key={`${skill}-${level}-${seedKey}`}
          title={`${skill || 'Mixed English'} Practice Drill`}
          questions={data.questions}
          submitLabel="Check & Earn XP"
          onAskAi={(q) => navigate(`/ai-tutor?prompt=${encodeURIComponent(q)}`)}
          onSubmit={async (answers, timeSpentSec) => {
            if (!user) {
              toast.info('Please log in to record skill progress and earn XP!');
              navigate('/login');
              throw new Error('Auth required');
            }
            const res = await api.post<GradePayload>('/learning/practice/grade', { answers, timeSpentSec });
            if (res.reward) celebrate(res.reward, 'Practice Drill Complete!');
            return res;
          }}
        />
      ) : (
        <div className="panel p-8 text-center">
          <Sparkles className="mx-auto mb-2 h-8 w-8 text-cyan" />
          <p className="font-bold">No questions matched this exact filter.</p>
          <Button className="mt-4" size="sm" onClick={() => applyFilter('', '')}>
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
}
