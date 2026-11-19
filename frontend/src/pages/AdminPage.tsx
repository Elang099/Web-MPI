import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CATEGORIES, GAME_SLUGS, LEVELS, ROLES, SKILLS } from '@fec/shared';
import { Award, Ban, BookOpen, Check, Megaphone, Plus, ShieldCheck, Trash2, Users } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/stores/auth';
import { toast } from '@/stores/ui';
import { ErrorState, PageHeader, PageLoader, Tabs } from '@/components/ui';
import { Button } from '@/components/ui/Button';

interface AdminOverview {
  counts: { users: number; lessons: number; topics: number; vocab: number; gameSessions: number; certificates: number };
  announcements: { id: string; title: string; body: string; audience: string; createdAt: string }[];
  reports: { id: string; reason: string; status: string; reporter: { username: string }; post: { id: string; content: string; isHidden: boolean; user: { username: string } } }[];
  auditLogs: { id: string; action: string; target?: string; createdAt: string; actor?: { username: string; role: string } | null }[];
}

export function AdminPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'overview' | 'users' | 'content' | 'comms'>('overview');

  const { data: overview, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.get<AdminOverview>('/admin/overview'),
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () =>
      api.get<{
        users: { id: string; email: string; username: string; displayName: string; role: string; isBanned: boolean; stats: { xp: number; level: number } | null }[];
      }>('/admin/users'),
  });

  const { data: contentData } = useQuery({
    queryKey: ['admin-content'],
    queryFn: () =>
      api.get<{
        topics: { id: string; slug: string; title: string; category: string }[];
        lessons: { id: string; slug: string; title: string; level: string; isPublished: boolean; topic: { title: string } }[];
        vocab: { id: string; word: string; category: string; meaning: string }[];
        questions: { id: string; prompt: string; gameSlug: string | null; skill: string }[];
        achievements: { id: string; title: string; metric: string; threshold: number }[];
        missions: { id: string; title: string; period: string; target: number }[];
      }>('/admin/content'),
  });

  const { data: certsData } = useQuery({
    queryKey: ['admin-certs'],
    queryFn: () => api.get<{ certificates: { id: string; code: string; title: string; revoked: boolean; user: { displayName: string; username: string } }[] }>('/admin/certificates'),
  });

  // Forms
  const [annForm, setAnnForm] = useState({ title: '', body: '', audience: 'ALL' });
  const [lessonForm, setLessonForm] = useState({ topicId: '', slug: '', title: '', summary: '', level: 'BEGINNER', durationMin: 10, bodyText: '' });
  const [vocabForm, setVocabForm] = useState({ word: '', partOfSpeech: 'noun', meaning: '', example: '', category: 'daily', level: 'BEGINNER' });
  const [qForm, setQForm] = useState({ prompt: '', optA: '', optB: '', optC: '', answer: '', explanation: '', skill: 'VOCABULARY', gameSlug: 'english-dash' });

  const updateUserMut = useMutation({
    mutationFn: ({ id, role, isBanned }: { id: string; role?: string; isBanned?: boolean }) => api.patch(`/admin/users/${id}`, { role, isBanned }),
    onSuccess: () => {
      toast.success('User updated');
      void qc.invalidateQueries({ queryKey: ['admin-users'] });
      void qc.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const createAnnouncement = async (e: FormEvent) => {
    e.preventDefault();
    await api.post('/admin/announcements', annForm);
    setAnnForm({ title: '', body: '', audience: 'ALL' });
    toast.success('Announcement published!');
    void qc.invalidateQueries({ queryKey: ['admin-overview'] });
  };

  const createLesson = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/lessons', {
        topicId: lessonForm.topicId || contentData?.topics[0]?.id,
        slug: lessonForm.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        title: lessonForm.title,
        summary: lessonForm.summary,
        level: lessonForm.level,
        audiences: ['GENERAL'],
        durationMin: Number(lessonForm.durationMin),
        content: [
          { type: 'objectives', items: [`Master ${lessonForm.title}`] },
          { type: 'text', title: 'Explanation', body: lessonForm.bodyText || lessonForm.summary },
        ],
      });
      setLessonForm({ topicId: '', slug: '', title: '', summary: '', level: 'BEGINNER', durationMin: 10, bodyText: '' });
      toast.success('Lesson created!');
      void qc.invalidateQueries({ queryKey: ['admin-content'] });
      void qc.invalidateQueries({ queryKey: ['topics'] });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const createVocab = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/vocabulary', vocabForm);
      setVocabForm({ word: '', partOfSpeech: 'noun', meaning: '', example: '', category: 'daily', level: 'BEGINNER' });
      toast.success('Vocabulary added!');
      void qc.invalidateQueries({ queryKey: ['admin-content'] });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const createGameQuestion = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/questions', {
        type: 'MCQ',
        prompt: qForm.prompt,
        data: { options: [qForm.optA, qForm.optB, qForm.optC].filter(Boolean) },
        answer: qForm.answer,
        explanation: qForm.explanation,
        skill: qForm.skill,
        gameSlug: qForm.gameSlug || null,
      });
      setQForm({ prompt: '', optA: '', optB: '', optC: '', answer: '', explanation: '', skill: 'VOCABULARY', gameSlug: 'english-dash' });
      toast.success('Question added to bank!');
      void qc.invalidateQueries({ queryKey: ['admin-content'] });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (isLoading) return <PageLoader />;
  if (error || !overview) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration & Content Studio"
        title="Admin Dashboard"
        subtitle={`Signed in as ${user?.displayName} (${user?.role}). Manage curriculum, game questions, users, moderation & certificates.`}
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'overview', label: 'Platform Overview' },
          { value: 'users', label: 'Users & Roles' },
          { value: 'content', label: 'Lessons, Vocab & Games' },
          { value: 'comms', label: 'Announcements, Reports & Certs' },
        ]}
      />

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Object.entries(overview.counts).map(([k, v]) => (
              <div key={k} className="panel p-4">
                <p className="text-xs font-semibold uppercase text-muted">{k}</p>
                <p className="mt-1 text-2xl font-bold text-cyan">{v}</p>
              </div>
            ))}
          </div>

          <div className="panel p-6">
            <h2 className="mb-3 flex items-center gap-2 font-bold">
              <ShieldCheck className="h-5 w-5 text-neon" /> Recent Admin Audit Log
            </h2>
            <div className="space-y-2 text-xs">
              {overview.auditLogs.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-xl bg-surface-2/50 px-3 py-2">
                  <span>
                    <strong className="text-cyan">{l.action}</strong> {l.target ? `→ ${l.target}` : ''} by @{l.actor?.username ?? 'system'}
                  </span>
                  <span className="text-muted">{new Date(l.createdAt).toLocaleString()}</span>
                </div>
              ))}
              {!overview.auditLogs.length && <p className="text-muted">No admin edits recorded yet.</p>}
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="panel overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 font-ui text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">XP / Level</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {usersData?.users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-bold">
                    {u.displayName} <span className="block text-xs font-normal text-muted">@{u.username}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">{u.email}</td>
                  <td className="px-4 py-3 text-xs">
                    Lv.{u.stats?.level ?? 1} · {u.stats?.xp ?? 0} XP
                  </td>
                  <td className="px-4 py-3">
                    <select
                      disabled={user?.role !== 'ADMIN'}
                      className="input py-1.5 text-xs"
                      value={u.role}
                      onChange={(e) => updateUserMut.mutate({ id: u.id, role: e.target.value })}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {user?.role === 'ADMIN' && u.id !== user.id && (
                      <Button
                        size="sm"
                        variant={u.isBanned ? 'success' : 'danger'}
                        icon={u.isBanned ? <Check className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                        onClick={() => updateUserMut.mutate({ id: u.id, isBanned: !u.isBanned })}
                      >
                        {u.isBanned ? 'Restore' : 'Suspend'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'content' && contentData && (
        <div className="space-y-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Create Lesson */}
            <form onSubmit={createLesson} className="panel space-y-3 p-6">
              <h2 className="flex items-center gap-2 font-bold">
                <BookOpen className="h-5 w-5 text-cyan" /> Create New Lesson
              </h2>
              <select className="input py-2 text-sm" value={lessonForm.topicId || contentData.topics[0]?.id || ''} onChange={(e) => setLessonForm({ ...lessonForm, topicId: e.target.value })}>
                {contentData.topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.category}] {t.title}
                  </option>
                ))}
              </select>
              <div className="grid gap-2 sm:grid-cols-2">
                <input className="input py-2 text-sm" required placeholder="Lesson Title" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} />
                <input className="input py-2 text-sm" required placeholder="slug-url-name" value={lessonForm.slug} onChange={(e) => setLessonForm({ ...lessonForm, slug: e.target.value })} />
              </div>
              <input className="input py-2 text-sm" required placeholder="Short summary" value={lessonForm.summary} onChange={(e) => setLessonForm({ ...lessonForm, summary: e.target.value })} />
              <textarea rows={2} className="input py-2 text-sm" placeholder="Main lesson explanation..." value={lessonForm.bodyText} onChange={(e) => setLessonForm({ ...lessonForm, bodyText: e.target.value })} />
              <div className="grid gap-2 sm:grid-cols-2">
                <select className="input py-2 text-sm" value={lessonForm.level} onChange={(e) => setLessonForm({ ...lessonForm, level: e.target.value })}>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <input type="number" className="input py-2 text-sm" min={3} max={60} value={lessonForm.durationMin} onChange={(e) => setLessonForm({ ...lessonForm, durationMin: Number(e.target.value) })} />
              </div>
              <Button type="submit" size="sm" icon={<Plus className="h-4 w-4" />}>
                Publish Lesson
              </Button>
            </form>

            {/* Create Vocabulary + Game Question */}
            <div className="space-y-6">
              <form onSubmit={createVocab} className="panel space-y-3 p-6">
                <h2 className="font-bold">Add Vocabulary Entry</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input className="input py-2 text-sm" required placeholder="Word" value={vocabForm.word} onChange={(e) => setVocabForm({ ...vocabForm, word: e.target.value })} />
                  <input className="input py-2 text-sm" required placeholder="Category (e.g. daily, business)" value={vocabForm.category} onChange={(e) => setVocabForm({ ...vocabForm, category: e.target.value })} />
                </div>
                <input className="input py-2 text-sm" required placeholder="Definition / meaning" value={vocabForm.meaning} onChange={(e) => setVocabForm({ ...vocabForm, meaning: e.target.value })} />
                <input className="input py-2 text-sm" placeholder="Example sentence" value={vocabForm.example} onChange={(e) => setVocabForm({ ...vocabForm, example: e.target.value })} />
                <Button type="submit" size="sm" variant="secondary" icon={<Plus className="h-4 w-4" />}>
                  Add Word
                </Button>
              </form>

              <form onSubmit={createGameQuestion} className="panel space-y-3 p-6">
                <h2 className="font-bold">Add Game Educational Question</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  <select className="input py-2 text-sm" value={qForm.gameSlug} onChange={(e) => setQForm({ ...qForm, gameSlug: e.target.value })}>
                    {GAME_SLUGS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  <select className="input py-2 text-sm" value={qForm.skill} onChange={(e) => setQForm({ ...qForm, skill: e.target.value })}>
                    {SKILLS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <input className="input py-2 text-sm" required placeholder="Question prompt" value={qForm.prompt} onChange={(e) => setQForm({ ...qForm, prompt: e.target.value })} />
                <div className="grid gap-2 sm:grid-cols-3">
                  <input className="input py-2 text-xs" required placeholder="Option A" value={qForm.optA} onChange={(e) => setQForm({ ...qForm, optA: e.target.value })} />
                  <input className="input py-2 text-xs" required placeholder="Option B" value={qForm.optB} onChange={(e) => setQForm({ ...qForm, optB: e.target.value })} />
                  <input className="input py-2 text-xs" required placeholder="Option C" value={qForm.optC} onChange={(e) => setQForm({ ...qForm, optC: e.target.value })} />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input className="input py-2 text-sm" required placeholder="Exact correct option" value={qForm.answer} onChange={(e) => setQForm({ ...qForm, answer: e.target.value })} />
                  <input className="input py-2 text-sm" required placeholder="Explanation" value={qForm.explanation} onChange={(e) => setQForm({ ...qForm, explanation: e.target.value })} />
                </div>
                <Button type="submit" size="sm" icon={<Plus className="h-4 w-4" />}>
                  Add Question
                </Button>
              </form>
            </div>
          </div>

          {/* Existing Lessons List */}
          <div className="panel p-6">
            <h2 className="mb-3 font-bold">Lessons ({contentData.lessons.length})</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {contentData.lessons.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-surface-2/40 px-3.5 py-2.5 text-xs">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{l.title}</p>
                    <p className="text-muted">
                      {l.topic.title} · {l.level}
                    </p>
                  </div>
                  <button
                    aria-label="Delete lesson"
                    onClick={async () => {
                      if (!window.confirm(`Delete "${l.title}"?`)) return;
                      await api.delete(`/admin/lessons/${l.id}`);
                      void qc.invalidateQueries({ queryKey: ['admin-content'] });
                    }}
                    className="text-muted hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'comms' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <form onSubmit={createAnnouncement} className="panel space-y-3 p-6">
              <h2 className="flex items-center gap-2 font-bold">
                <Megaphone className="h-5 w-5 text-cyan" /> Publish Announcement
              </h2>
              <input className="input py-2 text-sm" required placeholder="Headline" value={annForm.title} onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })} />
              <textarea rows={3} className="input py-2 text-sm" required placeholder="Announcement message..." value={annForm.body} onChange={(e) => setAnnForm({ ...annForm, body: e.target.value })} />
              <Button type="submit" size="sm">
                Publish
              </Button>
            </form>

            <div className="panel p-6">
              <h2 className="mb-3 font-bold">Community Moderation Reports</h2>
              <div className="space-y-3">
                {overview.reports.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-line bg-surface-2/40 p-3.5 text-xs">
                    <p className="font-bold">
                      Reported by @{r.reporter.username} · Status: {r.status}
                    </p>
                    <p className="mt-1 italic text-muted">Post by @{r.post.user.username}: “{r.post.content}”</p>
                    <p className="mt-1 text-warning">Reason: {r.reason}</p>
                    {r.status === 'OPEN' && (
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={async () => {
                            await api.patch(`/admin/reports/${r.id}`, { action: 'HIDE_POST' });
                            void qc.invalidateQueries({ queryKey: ['admin-overview'] });
                          }}
                        >
                          Hide Post
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            await api.patch(`/admin/reports/${r.id}`, { action: 'DISMISS' });
                            void qc.invalidateQueries({ queryKey: ['admin-overview'] });
                          }}
                        >
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {!overview.reports.length && <p className="text-xs text-muted">No open moderation reports.</p>}
              </div>
            </div>
          </div>

          <div className="panel p-6">
            <h2 className="mb-3 flex items-center gap-2 font-bold">
              <Award className="h-5 w-5 text-neon" /> Issued Certificates ({certsData?.certificates.length ?? 0})
            </h2>
            <div className="space-y-2 text-xs">
              {certsData?.certificates.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-line bg-surface-2/40 px-3 py-2.5">
                  <div>
                    <p className="font-bold">
                      {c.user.displayName} — {c.title}
                    </p>
                    <p className="text-muted">Code: {c.code}</p>
                  </div>
                  {user?.role === 'ADMIN' && (
                    <Button
                      size="sm"
                      variant={c.revoked ? 'success' : 'ghost'}
                      onClick={async () => {
                        await api.patch(`/admin/certificates/${c.id}/revoke`, { revoked: !c.revoked });
                        void qc.invalidateQueries({ queryKey: ['admin-certs'] });
                      }}
                    >
                      {c.revoked ? 'Restore' : 'Revoke'}
                    </Button>
                  )}
                </div>
              ))}
              {!certsData?.certificates.length && <p className="text-muted">No certificates issued yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
