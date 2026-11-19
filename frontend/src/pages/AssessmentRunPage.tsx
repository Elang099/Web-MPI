import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { GradedAnswer, PublicQuestion, RewardSummary } from '@fec/shared';
import { ArrowLeft, Award, CheckCircle2, Clock } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/stores/auth';
import { celebrate, toast } from '@/stores/ui';
import { ErrorState, PageLoader } from '@/components/ui';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ExerciseRunner, type GradePayload } from '@/learning/ExerciseRunner';

interface AssessmentDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  timeLimitMin: number;
  passingScore: number;
  questions: PublicQuestion[];
}

interface SubmitAssessmentResponse {
  attempt: { id: string; score: number; total: number; percent: number; passed: boolean; cefr: string | null };
  results: GradedAnswer[];
  breakdown: Record<string, { correct: number; total: number }>;
  issuedCertificates: { id: string; code: string; title: string }[];
  reward: RewardSummary;
}

export function AssessmentRunPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [outcome, setOutcome] = useState<SubmitAssessmentResponse | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['assessment', slug],
    queryFn: () => api.get<{ assessment: AssessmentDetail }>(`/assessments/${slug}`),
  });

  if (isLoading) return <PageLoader />;
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;
  const a = data.assessment;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/assessments" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-cyan">
        <ArrowLeft className="h-4 w-4" /> All Assessments
      </Link>

      <header className="panel border-cyan/30 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="chip text-cyan">{a.type}</span>
          <span className="chip">
            <Clock className="h-3 w-3" /> {a.timeLimitMin} minutes
          </span>
          <span className="chip">Pass threshold: {a.passingScore}%</span>
        </div>
        <h1 className="mt-3 text-3xl font-bold">{a.title}</h1>
        <p className="mt-1.5 text-muted">{a.description}</p>
      </header>

      {outcome && (
        <div className="panel border-success/50 bg-success/10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow text-success">Assessment Summary</p>
              <h2 className="mt-1 text-2xl font-bold">
                {outcome.attempt.percent}% — {outcome.attempt.passed ? 'Passed ✓' : 'Keep Practicing'}
                {outcome.attempt.cefr && ` · Estimated CEFR: ${outcome.attempt.cefr}`}
              </h2>
            </div>
            <ButtonLink to="/assessments" variant="secondary" size="sm">
              Back to Assessments
            </ButtonLink>
          </div>
          {outcome.issuedCertificates.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {outcome.issuedCertificates.map((c) => (
                <Button
                  key={c.id}
                  variant="success"
                  size="sm"
                  icon={<Award className="h-4 w-4" />}
                  onClick={() => void api.download(`/assessments/certificates/${c.id}/pdf`, `certificate-${c.code}.pdf`)}
                >
                  <CheckCircle2 className="h-4 w-4" /> Download {c.title}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      <ExerciseRunner
        title="Assessment Questions"
        questions={a.questions}
        submitLabel="Submit & Grade Assessment"
        onSubmit={async (answers, timeSpentSec) => {
          if (!user) {
            toast.info('Sign in to save assessment scores and unlock certificates!');
            navigate('/login');
            throw new Error('Authentication required');
          }
          const res = await api.post<SubmitAssessmentResponse>(`/assessments/${a.id}/submit`, { answers, timeSpentSec });
          setOutcome(res);
          celebrate(res.reward, `Assessment Graded (${res.attempt.percent}%)`);
          void qc.invalidateQueries({ queryKey: ['assessments'] });
          void qc.invalidateQueries({ queryKey: ['my-report'] });
          return {
            score: res.attempt.score,
            total: res.attempt.total,
            percent: res.attempt.percent,
            results: res.results,
            reward: res.reward,
          } satisfies GradePayload;
        }}
      />
    </div>
  );
}
