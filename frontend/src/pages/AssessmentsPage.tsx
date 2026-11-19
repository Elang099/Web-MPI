import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Award, Briefcase, CheckCircle2, Clock, Download, GraduationCap, Play, Target } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/stores/auth';
import { ErrorState, PageHeader, PageLoader, Tabs } from '@/components/ui';
import { Button } from '@/components/ui/Button';

interface AssessmentSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  skill?: string | null;
  careerField?: string | null;
  timeLimitMin: number;
  passingScore: number;
  questionCount: number;
  latestAttempt: { percent: number; passed: boolean; cefr: string | null } | null;
}

interface CareerField {
  title: string;
  desc: string;
  keySkills: string[];
  vocabFocus: string[];
  roles: string[];
}

export function AssessmentsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'tests' | 'career' | 'reports'>('tests');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => api.get<{ assessments: AssessmentSummary[]; careerFields: Record<string, CareerField> }>('/assessments'),
  });

  const { data: reportData } = useQuery({
    queryKey: ['my-report'],
    queryFn: () =>
      api.get<{
        report: { cefr: string; strengths: string[]; improvements: string[]; recommendations: string[]; completedLessons: string[] };
        certificateTracks: { key: string; title: string; level: string; minLessons: number; lessonsDone: number; assessmentPassed: boolean; assessmentSlug: string; earned: { id: string; code: string } | null }[];
      }>('/assessments/me/report'),
    enabled: !!user,
  });

  if (isLoading) return <PageLoader />;
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assessments & Career Readiness"
        title="Measure Your Fluency & Unlock Certificates"
        subtitle="Take Placement, Level, Skill, Final, and Career English exams—then download official PDF learning reports and certificates."
        actions={
          user && (
            <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={() => void api.download('/assessments/me/report/pdf', 'future-english-report.pdf')}>
              Download PDF Report
            </Button>
          )
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'tests', label: 'All Assessments' },
          { value: 'career', label: 'Career English Analysis' },
          { value: 'reports', label: 'Reports & Certificates' },
        ]}
      />

      {tab === 'tests' && (
        <div className="grid gap-4 md:grid-cols-2">
          {data.assessments.map((a) => (
            <div key={a.id} className="panel panel-hover flex flex-col justify-between p-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="chip text-cyan">{a.type}</span>
                  {a.latestAttempt && (
                    <span className={`chip ${a.latestAttempt.passed ? 'border-success/50 bg-success/10 text-success' : 'border-warning/50 text-warning'}`}>
                      {a.latestAttempt.passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />}
                      Best: {a.latestAttempt.percent}% {a.latestAttempt.cefr ? `(${a.latestAttempt.cefr})` : ''}
                    </span>
                  )}
                </div>
                <h2 className="mt-3 text-xl font-bold">{a.title}</h2>
                <p className="mt-1.5 text-sm text-muted">{a.description}</p>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-4">
                <span className="flex items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {a.timeLimitMin}m
                  </span>
                  <span>{a.questionCount} questions</span>
                  <span>Pass: {a.passingScore}%</span>
                </span>
                <Link
                  to={`/assessments/${a.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-gradient px-4 py-2 text-xs font-bold text-white shadow-glow"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  {a.latestAttempt ? 'Retake' : 'Start Test'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'career' && (
        <div className="grid gap-5 md:grid-cols-2">
          {Object.entries(data.careerFields).map(([key, field]) => (
            <div key={key} className="panel p-6">
              <div className="mb-3 flex items-center gap-2 text-cyan">
                <Briefcase className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Professional Field</span>
              </div>
              <h2 className="text-xl font-bold">{field.title}</h2>
              <p className="mt-1.5 text-sm text-muted">{field.desc}</p>

              <p className="mt-4 text-xs font-bold uppercase text-muted">Recommended English Skills</p>
              <ul className="mt-1.5 space-y-1 text-sm">
                {field.keySkills.map((s) => (
                  <li key={s}>• {s}</li>
                ))}
              </ul>

              <p className="mt-4 text-xs font-bold uppercase text-muted">Target Roles</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {field.roles.map((r) => (
                  <span key={r} className="chip">
                    {r}
                  </span>
                ))}
              </div>

              <p className="mt-4 text-xs font-bold uppercase text-muted">Power Vocabulary</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {field.vocabFocus.map((v) => (
                  <span key={v} className="rounded-lg bg-cyan/10 px-2.5 py-1 font-mono text-xs font-semibold text-cyan">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-6">
          {!user ? (
            <div className="panel p-8 text-center">
              <p className="font-bold">Sign in to view your personalized learning report and claim certificates.</p>
            </div>
          ) : (
            <>
              <div className="panel p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="eyebrow">Final Learning Report</p>
                    <h2 className="mt-1 text-2xl font-bold">CEFR Level: {reportData?.report.cefr ?? 'Pending Placement'}</h2>
                  </div>
                  <Button icon={<Download className="h-4 w-4" />} onClick={() => void api.download('/assessments/me/report/pdf', 'future-english-report.pdf')}>
                    Download Official PDF Report
                  </Button>
                </div>
                {reportData && (
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-surface-2/50 p-4">
                      <p className="text-xs font-bold text-success">Strengths</p>
                      <p className="mt-1 text-sm">{reportData.report.strengths.join(', ') || 'Complete exercises to identify strengths'}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-2/50 p-4">
                      <p className="text-xs font-bold text-warning">Areas for Improvement</p>
                      <p className="mt-1 text-sm">{reportData.report.improvements.join(', ') || 'Balanced mastery'}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-2/50 p-4">
                      <p className="text-xs font-bold text-cyan">Lessons Completed</p>
                      <p className="mt-1 text-2xl font-bold">{reportData.report.completedLessons.length}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {reportData?.certificateTracks.map((c) => (
                  <div key={c.key} className="panel flex flex-col justify-between p-6">
                    <div>
                      <GraduationCap className="h-8 w-8 text-neon" />
                      <h3 className="mt-3 text-lg font-bold">{c.title}</h3>
                      <p className="text-xs text-cyan">{c.level}</p>
                      <ul className="mt-4 space-y-1.5 text-xs text-muted">
                        <li className={c.lessonsDone >= c.minLessons ? 'text-success font-bold' : ''}>
                          {c.lessonsDone >= c.minLessons ? '✓' : '○'} Lessons completed: {c.lessonsDone} / {c.minLessons}
                        </li>
                        <li className={c.assessmentPassed ? 'text-success font-bold' : ''}>
                          {c.assessmentPassed ? '✓' : '○'} Pass {c.assessmentSlug.replace(/-/g, ' ')}
                        </li>
                      </ul>
                    </div>
                    <div className="mt-5 border-t border-line/60 pt-4">
                      {c.earned ? (
                        <Button
                          size="sm"
                          variant="success"
                          className="w-full"
                          icon={<Award className="h-4 w-4" />}
                          onClick={() => void api.download(`/assessments/certificates/${c.earned!.id}/pdf`, `certificate-${c.earned!.code}.pdf`)}
                        >
                          Download Certificate PDF
                        </Button>
                      ) : (
                        <span className="text-xs font-semibold text-muted">Complete criteria above to unlock</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
