import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CATEGORY_META, type Category, type LessonBlock, type PublicQuestion, type RewardSummary } from '@fec/shared';
import { ArrowLeft, Bot, CheckCircle2, Clock, Send, Sparkles, X } from 'lucide-react';
import { api } from '@/services/api';
import { celebrate, toast } from '@/stores/ui';
import { useAuth } from '@/stores/auth';
import { Badge, ErrorState, PageLoader } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { BlockRenderer } from '@/learning/BlockRenderer';
import { ExerciseRunner, type GradePayload } from '@/learning/ExerciseRunner';
import { MarkdownText } from '@/learning/MarkdownText';

interface LessonDetail {
  id: string;
  slug: string;
  title: string;
  summary: string;
  level: string;
  audiences: string[];
  durationMin: number;
  xpReward: number;
  emoji?: string;
  content: LessonBlock[];
  topic: { slug: string; title: string; category: Category };
  exercises: { id: string; title: string; skill: string; questions: PublicQuestion[] }[];
  progress: { status: string; bestScore: number };
}

export function LessonPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [startedAt] = useState(() => Date.now());
  const [completing, setCompleting] = useState(false);

  // Embedded AI Tutor Drawer
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [convId, setConvId] = useState<string | undefined>(undefined);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['lesson', slug],
    queryFn: () => api.get<{ lesson: LessonDetail }>(`/learning/lessons/${slug}`),
  });

  const askAi = async (prompt: string) => {
    setAiOpen(true);
    if (!user) {
      toast.info('Sign in to chat with the AI English Tutor!');
      return;
    }
    setAiLoading(true);
    setAiMessages((m) => [...m, { role: 'user', content: prompt }]);
    try {
      const res = await api.post<{ conversationId: string; messages: { role: 'user' | 'assistant'; content: string }[] }>('/ai/chat', {
        conversationId: convId,
        mode: 'explain',
        message: prompt,
        context: data?.lesson ? `Lesson: ${data.lesson.title} (${data.lesson.summary})` : undefined,
      });
      setConvId(res.conversationId);
      const reply = res.messages[res.messages.length - 1];
      setAiMessages((m) => [...m, { role: 'assistant', content: reply.content }]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAiLoading(false);
    }
  };

  const markComplete = async () => {
    if (!user) return navigate('/login');
    if (!data?.lesson) return;
    setCompleting(true);
    try {
      const res = await api.post<{ reward: RewardSummary }>(`/learning/lessons/${data.lesson.id}/complete`, {
        timeSpentSec: Math.round((Date.now() - startedAt) / 1000),
      });
      celebrate(res.reward, 'Lesson Completed!');
      void qc.invalidateQueries({ queryKey: ['lesson', slug] });
      void qc.invalidateQueries({ queryKey: ['topics'] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCompleting(false);
    }
  };

  if (isLoading) return <PageLoader />;
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const { lesson } = data;
  const meta = CATEGORY_META[lesson.topic.category];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/learn" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-cyan">
          <ArrowLeft className="h-4 w-4" /> Back to Learning Center
        </Link>
        <Button size="sm" variant="outline" icon={<Bot className="h-4 w-4" />} onClick={() => setAiOpen(true)}>
          Ask AI Tutor
        </Button>
      </div>

      {/* Lesson Hero */}
      <header className="panel border-cyan/30 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge color={meta.color}>{meta.label}</Badge>
          <span className="chip">{lesson.level}</span>
          <span className="chip">{lesson.audiences.join(' · ')}</span>
          <span className="chip">
            <Clock className="h-3 w-3" /> {lesson.durationMin} min
          </span>
          {lesson.progress.status === 'COMPLETED' && (
            <span className="chip border-success/50 bg-success/10 text-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Completed ({lesson.progress.bestScore}%)
            </span>
          )}
        </div>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
          {lesson.emoji ?? '📘'} {lesson.title}
        </h1>
        <p className="mt-2 text-muted">{lesson.summary}</p>
      </header>

      {/* Interactive Learning Blocks */}
      <div className="space-y-5">
        {lesson.content.map((block, idx) => (
          <BlockRenderer key={idx} block={block} lessonId={lesson.id} onAskAi={askAi} />
        ))}
      </div>

      {/* Practice Exercises */}
      {lesson.exercises.map((ex) => (
        <ExerciseRunner
          key={ex.id}
          title={ex.title}
          questions={ex.questions}
          onAskAi={askAi}
          onSubmit={async (answers, timeSpentSec) => {
            if (!user) {
              toast.info('Sign in to submit answers and earn XP!');
              navigate('/login');
              throw new Error('Authentication required');
            }
            const res = await api.post<GradePayload>(`/learning/exercises/${ex.id}/submit`, { answers, timeSpentSec });
            if (res.reward) celebrate(res.reward, `Exercise Complete (${res.percent}%)`);
            void qc.invalidateQueries({ queryKey: ['lesson', slug] });
            return res;
          }}
        />
      ))}

      {/* Explicit Mark Lesson Complete Bar */}
      <div className="panel flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h3 className="font-bold">Finished studying this module?</h3>
          <p className="text-sm text-muted">Mark the lesson complete to track progress on your Learning Path and earn +{lesson.xpReward} XP.</p>
        </div>
        <Button
          size="lg"
          variant={lesson.progress.status === 'COMPLETED' ? 'success' : 'primary'}
          loading={completing}
          icon={lesson.progress.status === 'COMPLETED' ? <CheckCircle2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          onClick={markComplete}
        >
          {lesson.progress.status === 'COMPLETED' ? 'Completed ✓' : `Complete Lesson (+${lesson.xpReward} XP)`}
        </Button>
      </div>

      {/* Slide-in AI Tutor Helper Drawer */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={() => setAiOpen(false)}>
          <div className="flex h-full w-full max-w-md flex-col border-l border-line bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-cyan" />
                <div>
                  <h3 className="font-bold">AI Lesson Assistant</h3>
                  <p className="text-xs text-muted">{lesson.title}</p>
                </div>
              </div>
              <button onClick={() => setAiOpen(false)} className="rounded-xl p-1 text-muted hover:bg-surface-2">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {aiMessages.length === 0 && (
                <div className="space-y-2 rounded-2xl bg-surface-2/60 p-4 text-sm text-muted">
                  <p className="font-bold text-ink">Need a quick clarification?</p>
                  <button onClick={() => void askAi(`Give me 3 more simple examples for "${lesson.title}".`)} className="block text-left text-xs text-cyan hover:underline">
                    → Give me 3 more simple examples
                  </button>
                  <button onClick={() => void askAi(`What is the most common mistake students make in "${lesson.title}"?`)} className="block text-left text-xs text-cyan hover:underline">
                    → Common mistakes to avoid
                  </button>
                </div>
              )}
              {aiMessages.map((m, i) => (
                <div key={i} className={`rounded-2xl p-3.5 text-sm ${m.role === 'user' ? 'ml-8 bg-cyan/15' : 'mr-4 border border-line bg-surface-2/60'}`}>
                  <MarkdownText text={m.content} />
                </div>
              ))}
              {aiLoading && <p className="text-xs text-cyan">Thinking...</p>}
            </div>

            <form
              className="mt-3 flex gap-2 border-t border-line pt-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!aiInput.trim()) return;
                const q = aiInput;
                setAiInput('');
                void askAi(q);
              }}
            >
              <input className="input py-2 text-sm" placeholder="Ask about this lesson..." value={aiInput} onChange={(e) => setAiInput(e.target.value)} />
              <Button size="sm" type="submit" disabled={aiLoading} icon={<Send className="h-4 w-4" />}>
                Send
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
