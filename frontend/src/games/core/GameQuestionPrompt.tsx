import { useState } from 'react';
import type { PublicQuestion } from '@fec/shared';
import { RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import { useSpeak } from '@/hooks/useSpeech';

/**
 * Renders ANY server-issued PublicQuestion (MCQ, TRUE_FALSE, LISTEN, FILL, ORDER, MATCH)
 * with explicit instructions and interactive controls so no game modal can ever appear blank.
 */
export function GameQuestionPrompt({
  question,
  submitLabel = 'Submit Answer',
  onSubmit,
}: {
  question: PublicQuestion;
  submitLabel?: string;
  onSubmit: (response: string | string[]) => void;
}) {
  const { say } = useSpeak();
  const [fillVal, setFillVal] = useState('');
  const [pickedIdx, setPickedIdx] = useState<number[]>([]);
  const [matchPairs, setMatchPairs] = useState<Record<string, string>>({});

  const promptText = question.prompt.replace(/\*\*/g, '');

  // 1. Multiple Choice / True-False / Listen
  if ((question.type === 'MCQ' || question.type === 'TRUE_FALSE' || question.type === 'LISTEN') && (question.data.options?.length ?? 0) > 0) {
    return (
      <div className="space-y-4">
        <p className="text-xs font-extrabold uppercase tracking-wider text-game-sky">
          {question.type === 'LISTEN' ? '🎧 Tap Play Audio, then choose the right answer:' : '👇 Choose the correct answer:'}
        </p>
        <p className="text-base font-bold text-white">{promptText}</p>
        {question.type === 'LISTEN' && question.data.audioText && (
          <button
            type="button"
            onClick={() => say(question.data.audioText!)}
            className="btn-game bg-game-grape px-4 py-2 text-xs"
          >
            <Volume2 className="h-4 w-4" /> Play Audio Clip
          </button>
        )}
        <div className="space-y-2">
          {question.data.options!.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onSubmit(opt)}
              className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-left text-sm font-bold text-white transition hover:border-game-sky hover:bg-game-sky/20"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 2. Sentence Ordering
  if (question.type === 'ORDER' && (question.data.tokens?.length ?? 0) > 0) {
    const tokens = question.data.tokens!;
    const built = pickedIdx.map((i) => tokens[i]).join(' ');
    return (
      <div className="space-y-4">
        <p className="text-xs font-extrabold uppercase tracking-wider text-game-sky">🧩 Tap the words in order to form the sentence:</p>
        <p className="text-base font-bold text-white">{promptText}</p>
        <div className="min-h-[48px] rounded-2xl border border-dashed border-white/25 bg-black/25 p-3 flex flex-wrap gap-2">
          {pickedIdx.length === 0 && <span className="text-xs text-white/50">Tap word tiles below...</span>}
          {pickedIdx.map((idx, pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => setPickedIdx((p) => p.filter((_, x) => x !== pos))}
              className="rounded-xl bg-game-sky px-3 py-1 text-xs font-extrabold text-navy-950"
            >
              {tokens[idx]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {tokens.map((t, idx) => (
            <button
              key={idx}
              type="button"
              disabled={pickedIdx.includes(idx)}
              onClick={() => setPickedIdx((p) => [...p, idx])}
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-30"
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPickedIdx([])} className="btn-game bg-white/15 px-3 py-2 text-xs">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button
            type="button"
            disabled={pickedIdx.length === 0}
            onClick={() => {
              onSubmit(built);
              setPickedIdx([]);
            }}
            className="btn-game flex-1 bg-gradient-to-r from-game-grass to-emerald-500 py-2 text-xs disabled:opacity-40"
          >
            <Sparkles className="h-3.5 w-3.5" /> {submitLabel}
          </button>
        </div>
      </div>
    );
  }

  // 3. Matching Pairs
  if (question.type === 'MATCH' && question.data.left && question.data.right) {
    const left = question.data.left;
    const right = question.data.right;
    const allMatched = left.every((l) => Boolean(matchPairs[l]));
    return (
      <div className="space-y-4">
        <p className="text-xs font-extrabold uppercase tracking-wider text-game-sky">🔗 Match each item on the left with its pair:</p>
        <p className="text-base font-bold text-white">{promptText}</p>
        <div className="space-y-2">
          {left.map((l) => (
            <div key={l} className="grid grid-cols-2 items-center gap-2">
              <span className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white">{l}</span>
              <select
                className="input !bg-[#0A0F2D]/90 !border-white/20 py-2 text-xs !text-white"
                value={matchPairs[l] ?? ''}
                onChange={(e) => setMatchPairs((p) => ({ ...p, [l]: e.target.value }))}
              >
                <option value="">Choose match...</option>
                {right.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <button
          type="button"
          disabled={!allMatched}
          onClick={() => {
            onSubmit(left.map((l) => `${l}=>${matchPairs[l]}`));
            setMatchPairs({});
          }}
          className="btn-game w-full bg-gradient-to-r from-game-grass to-emerald-500 py-2.5 text-xs disabled:opacity-40"
        >
          {submitLabel}
        </button>
      </div>
    );
  }

  // 4. Fill in the Blank (default fallback)
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!fillVal.trim()) return;
        const val = fillVal.trim();
        setFillVal('');
        onSubmit(val);
      }}
    >
      <p className="text-xs font-extrabold uppercase tracking-wider text-game-sky">✍️ Type the missing English word below and submit:</p>
      <p className="text-base font-bold text-white">{promptText}</p>
      {question.data.hint && <p className="text-xs font-semibold text-game-sun">Hint: {question.data.hint}</p>}
      <input
        autoFocus
        className="input !bg-[#0A0F2D]/90 !border-white/20 text-sm !text-white placeholder:!text-white/50"
        placeholder="Type your answer here..."
        value={fillVal}
        onChange={(e) => setFillVal(e.target.value)}
      />
      <button type="submit" disabled={!fillVal.trim()} className="btn-game w-full bg-gradient-to-r from-game-grass to-emerald-500 py-2.5 text-sm disabled:opacity-40">
        <Sparkles className="h-4 w-4" /> {submitLabel}
      </button>
    </form>
  );
}
