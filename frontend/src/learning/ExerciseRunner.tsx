import { useMemo, useState } from 'react';
import clsx from 'clsx';
import type { GradedAnswer, PublicQuestion, RewardSummary } from '@fec/shared';
import { CheckCircle2, HelpCircle, RotateCcw, Sparkles, Volume2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/Progress';
import { MarkdownText } from './MarkdownText';
import { useSpeak } from '@/hooks/useSpeech';

export interface GradePayload {
  score: number;
  total: number;
  percent: number;
  results: GradedAnswer[];
  reward?: RewardSummary;
}

export function ExerciseRunner({
  title,
  questions,
  onSubmit,
  onAskAi,
  submitLabel = 'Submit Answers',
}: {
  title: string;
  questions: PublicQuestion[];
  onSubmit: (answers: { questionId: string; response: string | string[] }[], timeSpentSec: number) => Promise<GradePayload>;
  onAskAi?: (prompt: string) => void;
  submitLabel?: string;
}) {
  const [responses, setResponses] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GradePayload | null>(null);
  const [startedAt] = useState(() => Date.now());
  const { say } = useSpeak();

  const answeredCount = useMemo(
    () => questions.filter((q) => {
      const r = responses[q.id];
      return Array.isArray(r) ? r.length > 0 : typeof r === 'string' && r.trim().length > 0;
    }).length,
    [questions, responses],
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({ questionId: q.id, response: responses[q.id] ?? '' }));
      const res = await onSubmit(payload, Math.round((Date.now() - startedAt) / 1000));
      setResult(res);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setResponses({});
    setResult(null);
  };

  const gradedById = useMemo(() => new Map(result?.results.map((r) => [r.questionId, r]) ?? []), [result]);

  return (
    <section className="panel border-cyan/30 p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Interactive Practice</p>
          <h2 className="mt-1 text-2xl font-bold">{title}</h2>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-cyan">
            {answeredCount} / {questions.length} answered
          </span>
          <ProgressBar value={(answeredCount / Math.max(1, questions.length)) * 100} className="mt-1.5 w-36" />
        </div>
      </div>

      {result && (
        <div
          className={clsx(
            'mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border p-5',
            result.percent >= 70 ? 'border-success/50 bg-success/10' : 'border-warning/50 bg-warning/10',
          )}
        >
          <div>
            <p className="text-xl font-bold">
              Score: {result.score} / {result.total} ({result.percent}%)
            </p>
            <p className="text-sm text-muted">
              {result.percent === 100
                ? 'Perfect score! Every answer mastered.'
                : result.percent >= 70
                  ? 'Great job! Review any explanations below.'
                  : 'Good practice — read the explanations below and try again!'}
            </p>
          </div>
          <Button variant="secondary" size="sm" icon={<RotateCcw className="h-4 w-4" />} onClick={reset}>
            Try Again
          </Button>
        </div>
      )}

      <div className="space-y-6">
        {questions.map((q, idx) => {
          const g = gradedById.get(q.id);
          const val = responses[q.id];
          return (
            <div
              key={q.id}
              className={clsx(
                'rounded-3xl border p-5 transition',
                g ? (g.isCorrect ? 'border-success/50 bg-success/5' : 'border-danger/50 bg-danger/5') : 'border-line bg-surface-2/30',
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-bold text-cyan">
                    {idx + 1}
                  </span>
                  <MarkdownText text={q.prompt} className="font-semibold" />
                </div>
                {q.skill && <span className="chip shrink-0">{q.skill}</span>}
              </div>

              {/* Audio clip for LISTEN questions */}
              {q.type === 'LISTEN' && q.data.audioText && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" icon={<Volume2 className="h-4 w-4" />} onClick={() => say(q.data.audioText!, 0.9)}>
                    Play Audio Clip
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => say(q.data.audioText!, 0.72)}>
                    Slow
                  </Button>
                </div>
              )}

              {/* MCQ / TRUE_FALSE / LISTEN options */}
              {(q.type === 'MCQ' || q.type === 'TRUE_FALSE' || q.type === 'LISTEN') && q.data.options && (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {q.data.options.map((opt) => {
                    const selected = val === opt;
                    const rightOpt = g && String(g.correctAnswer) === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={!!result}
                        onClick={() => setResponses((r) => ({ ...r, [q.id]: opt }))}
                        className={clsx(
                          'rounded-2xl border p-3.5 text-left text-sm font-medium transition',
                          !result && (selected ? 'border-cyan bg-cyan/15 text-ink' : 'border-line bg-surface hover:border-cyan/60'),
                          result && rightOpt && 'border-success bg-success/15 text-success',
                          result && selected && !rightOpt && 'border-danger bg-danger/15 text-danger',
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* FILL */}
              {q.type === 'FILL' && (
                <div>
                  <input
                    className="input text-sm"
                    disabled={!!result}
                    placeholder={q.data.hint ? `Hint: ${q.data.hint}` : 'Type your answer...'}
                    value={typeof val === 'string' ? val : ''}
                    onChange={(e) => setResponses((r) => ({ ...r, [q.id]: e.target.value }))}
                  />
                </div>
              )}

              {/* ORDER */}
              {q.type === 'ORDER' && q.data.tokens && (
                <OrderQuestion
                  tokens={q.data.tokens}
                  disabled={!!result}
                  value={typeof val === 'string' ? val : ''}
                  onChange={(s) => setResponses((r) => ({ ...r, [q.id]: s }))}
                />
              )}

              {/* MATCH */}
              {q.type === 'MATCH' && q.data.left && q.data.right && (
                <MatchQuestion
                  left={q.data.left}
                  right={q.data.right}
                  disabled={!!result}
                  value={Array.isArray(val) ? val : []}
                  onChange={(pairs) => setResponses((r) => ({ ...r, [q.id]: pairs }))}
                />
              )}

              {/* Graded Explanation */}
              {g && (
                <div className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-surface p-3.5 text-sm">
                  <div className="flex items-start gap-2">
                    {g.isCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                    )}
                    <div>
                      {!g.isCorrect && (
                        <p className="font-bold text-success">
                          Correct answer: {Array.isArray(g.correctAnswer) ? g.correctAnswer.join(', ') : g.correctAnswer}
                        </p>
                      )}
                      <MarkdownText text={g.explanation} className="text-muted" />
                    </div>
                  </div>
                  {!g.isCorrect && onAskAi && (
                    <button
                      type="button"
                      onClick={() => onAskAi(`Explain why the answer to "${q.prompt}" is "${g.correctAnswer}".`)}
                      className="flex items-center gap-1 text-xs font-bold text-cyan hover:underline"
                    >
                      <HelpCircle className="h-3.5 w-3.5" /> Explain with AI
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!result && (
        <div className="mt-6 flex justify-end">
          <Button size="lg" loading={submitting} disabled={answeredCount === 0} icon={<Sparkles className="h-4 w-4" />} onClick={handleSubmit}>
            {submitLabel}
          </Button>
        </div>
      )}
    </section>
  );
}

function OrderQuestion({
  tokens,
  value,
  disabled,
  onChange,
}: {
  tokens: string[];
  value: string;
  disabled: boolean;
  onChange: (val: string) => void;
}) {
  const [pickedIndices, setPickedIndices] = useState<number[]>([]);
  const pick = (idx: number) => {
    const next = [...pickedIndices, idx];
    setPickedIndices(next);
    onChange(next.map((i) => tokens[i]).join(' '));
  };
  const unpick = (pos: number) => {
    const next = pickedIndices.filter((_, p) => p !== pos);
    setPickedIndices(next);
    onChange(next.map((i) => tokens[i]).join(' '));
  };

  return (
    <div>
      <div className="min-h-[48px] rounded-2xl border border-dashed border-line bg-surface p-3 flex flex-wrap gap-2">
        {pickedIndices.length === 0 && <span className="text-xs text-muted">{value || 'Tap tokens below in order...'}</span>}
        {pickedIndices.map((idx, pos) => (
          <button
            key={pos}
            type="button"
            disabled={disabled}
            onClick={() => unpick(pos)}
            className="rounded-xl bg-cyan/20 px-3 py-1 text-sm font-semibold text-ink"
          >
            {tokens[idx]}
          </button>
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {tokens.map((t, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled || pickedIndices.includes(idx)}
            onClick={() => pick(idx)}
            className={clsx('rounded-xl border border-line bg-surface px-3 py-1.5 text-sm font-medium', pickedIndices.includes(idx) && 'opacity-30')}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

function MatchQuestion({
  left,
  right,
  value,
  disabled,
  onChange,
}: {
  left: string[];
  right: string[];
  value: string[];
  disabled: boolean;
  onChange: (pairs: string[]) => void;
}) {
  const selectedMap = new Map(value.map((p) => p.split('=>') as [string, string]));
  const setPair = (l: string, r: string) => {
    const next = new Map(selectedMap);
    if (r) next.set(l, r);
    else next.delete(l);
    onChange([...next.entries()].map(([a, b]) => `${a}=>${b}`));
  };

  return (
    <div className="space-y-2.5">
      {left.map((l) => (
        <div key={l} className="grid items-center gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-semibold">{l}</div>
          <select
            disabled={disabled}
            className="input py-2.5 text-sm"
            value={selectedMap.get(l) ?? ''}
            onChange={(e) => setPair(l, e.target.value)}
          >
            <option value="">Select match...</option>
            {right.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
