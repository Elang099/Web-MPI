import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, Download, GraduationCap, Sparkles } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/stores/ui';
import { EmptyState, ErrorState, PageHeader, PageLoader } from '@/components/ui';
import { Button, ButtonLink } from '@/components/ui/Button';

export function CertificatesPage() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-report'],
    queryFn: () =>
      api.get<{
        certificates: { id: string; code: string; title: string; level: string; issuedAt: string }[];
        certificateTracks: { key: string; title: string; level: string; minLessons: number; lessonsDone: number; assessmentPassed: boolean; assessmentSlug: string; earned: { id: string } | null }[];
      }>('/assessments/me/report'),
  });

  const claimMut = useMutation({
    mutationFn: () => api.post<{ issued: { title: string }[] }>('/assessments/me/certificates/claim'),
    onSuccess: (res) => {
      if (res.issued.length) toast.success(`Issued ${res.issued.length} new certificate(s)!`);
      else toast.info('Complete all track criteria to unlock your next certificate.');
      void qc.invalidateQueries({ queryKey: ['my-report'] });
    },
  });

  if (isLoading) return <PageLoader />;
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Credentials"
        title="Your English Certificates"
        subtitle="Verified FUTURE ENGLISH CENTER certificates earned by completing curriculum milestones and passing level exams."
        actions={
          <Button icon={<Sparkles className="h-4 w-4" />} loading={claimMut.isPending} onClick={() => claimMut.mutate()}>
            Check & Issue Eligible Certificates
          </Button>
        }
      />

      {data.certificates.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-7 w-7" />}
          title="No certificates earned yet"
          body="Complete the required lessons and pass the matching level assessment below to generate your downloadable PDF certificate."
          action={<ButtonLink to="/assessments">Explore Assessments</ButtonLink>}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {data.certificates.map((c) => (
            <div key={c.id} className="panel border-cyan/50 bg-gradient-to-br from-navy-900 to-surface p-6 shadow-glow">
              <div className="flex items-start justify-between">
                <Award className="h-10 w-10 text-cyan" />
                <span className="chip text-cyan">{c.code}</span>
              </div>
              <h2 className="mt-4 text-xl font-bold">{c.title}</h2>
              <p className="text-sm text-neon">{c.level}</p>
              <p className="mt-1 text-xs text-muted">Issued {new Date(c.issuedAt).toLocaleDateString('en-US')}</p>
              <Button className="mt-5" size="sm" icon={<Download className="h-4 w-4" />} onClick={() => void api.download(`/assessments/certificates/${c.id}/pdf`, `certificate-${c.code}.pdf`)}>
                Download Official PDF
              </Button>
            </div>
          ))}
        </div>
      )}

      <section>
        <h2 className="mb-4 text-xl font-bold">Certificate Requirements</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {data.certificateTracks.map((t) => (
            <div key={t.key} className="panel p-5">
              <h3 className="font-bold">{t.title}</h3>
              <p className="text-xs text-cyan">{t.level}</p>
              <ul className="mt-3 space-y-1.5 text-xs text-muted">
                <li className={t.lessonsDone >= t.minLessons ? 'font-bold text-success' : ''}>
                  {t.lessonsDone >= t.minLessons ? '✓' : '○'} {t.lessonsDone}/{t.minLessons} lessons completed
                </li>
                <li className={t.assessmentPassed ? 'font-bold text-success' : ''}>
                  {t.assessmentPassed ? '✓' : '○'} Pass{' '}
                  <Link to={`/assessments/${t.assessmentSlug}`} className="underline text-cyan">
                    {t.assessmentSlug.replace(/-/g, ' ')}
                  </Link>
                </li>
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
