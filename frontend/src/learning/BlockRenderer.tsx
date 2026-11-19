import { useState } from 'react';
import clsx from 'clsx';
import type { LessonBlock } from '@fec/shared';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Lightbulb,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Volume2,
  XCircle,
} from 'lucide-react';
import { MarkdownText } from './MarkdownText';
import { speechSimilarity, useSpeak, useSpeechRecognition } from '@/hooks/useSpeech';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';
import { celebrate, toast } from '@/stores/ui';
import type { RewardSummary } from '@fec/shared';

export function BlockRenderer({
  block,
  lessonId,
  onAskAi,
}: {
  block: LessonBlock;
  lessonId?: string;
  onAskAi?: (prompt: string) => void;
}) {
  switch (block.type) {
    case 'objectives':
      return (
        <div className="panel border-cyan/30 bg-gradient-to-br from-cyan/10 to-transparent p-6">
          <p className="eyebrow mb-3">Learning Objectives</p>
          <ul className="space-y-2">
            {block.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm sm:text-base">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan" />
                <MarkdownText text={item} />
              </li>
            ))}
          </ul>
        </div>
      );

    case 'text':
      return (
        <div className="panel p-6">
          {block.title && <h3 className="mb-3 text-lg font-bold">{block.title}</h3>}
          <MarkdownText text={block.body} className="leading-relaxed text-ink/90" />
        </div>
      );

    case 'callout': {
      const styles = {
        tip: { cls: 'border-cyan/40 bg-cyan/10 text-cyan', Icon: Lightbulb, label: 'Pro Tip' },
        remember: { cls: 'border-neon/40 bg-neon/10 text-neon', Icon: Sparkles, label: 'Remember' },
        warning: { cls: 'border-warning/40 bg-warning/10 text-warning', Icon: AlertTriangle, label: 'Watch Out' },
        note: { cls: 'border-line bg-surface-2/60 text-cyan', Icon: BookOpen, label: 'Note' },
      }[block.variant];
      const Icon = styles.Icon;
      return (
        <div className={clsx('rounded-3xl border p-5', styles.cls)}>
          <div className="mb-1.5 flex items-center gap-2 text-sm font-bold">
            <Icon className="h-4 w-4" />
            <span>{block.title ?? styles.label}</span>
          </div>
          <MarkdownText text={block.body} className="text-sm leading-relaxed text-ink/90" />
        </div>
      );
    }

    case 'formula':
      return (
        <div className="panel p-6">
          {block.title && <h3 className="mb-4 text-lg font-bold">{block.title}</h3>}
          <div className="flex flex-wrap items-center gap-2.5">
            {block.parts.map((p, i) => (
              <div
                key={i}
                className="rounded-2xl border px-4 py-3"
                style={{ borderColor: `${p.color ?? '#00D1FF'}55`, background: `${p.color ?? '#00D1FF'}14` }}
              >
                <span className="block font-ui text-[11px] font-bold uppercase tracking-wider text-muted">{p.label}</span>
                <span className="mt-0.5 block font-display text-base font-bold text-ink">{p.value}</span>
              </div>
            ))}
          </div>
          {block.example && (
            <div className="mt-4 rounded-2xl bg-surface-2/70 p-3.5 text-sm">
              <MarkdownText text={`**Example:** ${block.example}`} />
            </div>
          )}
        </div>
      );

    case 'examples':
      return <ExamplesBlock title={block.title} items={block.items} />;

    case 'table':
      return (
        <div className="panel overflow-hidden">
          {block.title && <h3 className="border-b border-line/70 px-6 py-4 text-lg font-bold">{block.title}</h3>}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2/70 font-ui text-xs uppercase tracking-wider text-muted">
                <tr>
                  {block.headers.map((h, i) => (
                    <th key={i} className="px-5 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {block.rows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-surface-2/30">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-5 py-3.5 align-top">
                        <MarkdownText text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case 'wordCards':
      return <WordCardsBlock title={block.title} cards={block.cards} />;

    case 'dialogue':
      return <DialogueBlock title={block.title} context={block.context} lines={block.lines} />;

    case 'reading':
      return <ReadingBlock title={block.title} passage={block.passage} glossary={block.glossary} onAskAi={onAskAi} />;

    case 'audio':
      return <AudioBlock title={block.title} text={block.text} transcriptHidden={block.transcriptHidden} />;

    case 'expandable':
      return <ExpandableBlock title={block.title} items={block.items} />;

    case 'steps':
      return (
        <div className="panel p-6">
          {block.title && <h3 className="mb-4 text-lg font-bold">{block.title}</h3>}
          <div className="space-y-4">
            {block.items.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-bold">{step.title}</h4>
                  <MarkdownText text={step.body} className="mt-1 text-sm text-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'timeline':
      return (
        <div className="panel p-6">
          {block.title && <h3 className="mb-4 text-lg font-bold">{block.title}</h3>}
          <div className="relative my-8 h-3 rounded-full bg-surface-2">
            {block.markers.map((m, i) => (
              <div
                key={i}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${m.position}%` }}
              >
                {m.span && (
                  <div
                    className="absolute top-1/2 -z-0 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan/40"
                    style={{ width: `${Math.max(40, m.span * 3)}px` }}
                  />
                )}
                <div className="relative z-10 h-5 w-5 rounded-full border-2 border-bg bg-brand-gradient shadow-glow" />
                <span className="mt-2 block w-max max-w-[140px] -translate-x-1/2 text-center text-xs font-semibold text-ink/90">
                  {m.label}
                </span>
              </div>
            ))}
          </div>
          {block.caption && <p className="mt-10 text-center text-sm text-muted">{block.caption}</p>}
        </div>
      );

    case 'sentenceBuilder':
      return <SentenceBuilderBlock prompt={block.prompt} words={block.words} answer={block.answer} />;

    case 'quickCheck':
      return <QuickCheckBlock question={block.question} options={block.options} answer={block.answer} explanation={block.explanation} />;

    case 'sort':
      return <SortBlock prompt={block.prompt} buckets={block.buckets} items={block.items} />;

    case 'speakingPrompt':
      return <SpeakingBlock prompt={block.prompt} sample={block.sample} tips={block.tips} lessonId={lessonId} />;

    case 'writingPrompt':
      return <WritingBlock prompt={block.prompt} minWords={block.minWords} checklist={block.checklist} modelAnswer={block.modelAnswer} lessonId={lessonId} onAskAi={onAskAi} />;
  }
}

function ExamplesBlock({ title, items }: { title?: string; items: { en: string; note?: string; wrong?: boolean }[] }) {
  const { say } = useSpeak();
  return (
    <div className="panel p-6">
      {title && <h3 className="mb-4 text-lg font-bold">{title}</h3>}
      <div className="space-y-3">
        {items.map((it, i) => (
          <div
            key={i}
            className={clsx(
              'flex items-start justify-between gap-3 rounded-2xl border p-4',
              it.wrong ? 'border-danger/40 bg-danger/10' : 'border-line bg-surface-2/40',
            )}
          >
            <div>
              <div className="flex items-center gap-2">
                {it.wrong ? <XCircle className="h-4 w-4 shrink-0 text-danger" /> : <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />}
                <MarkdownText text={it.en} className="font-medium" />
              </div>
              {it.note && <p className="mt-1 pl-6 text-xs text-muted">{it.note}</p>}
            </div>
            {!it.wrong && (
              <button
                type="button"
                aria-label="Listen"
                onClick={() => say(it.en.replace(/\*\*/g, ''))}
                className="rounded-xl p-2 text-cyan hover:bg-cyan/10"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function WordCardsBlock({
  title,
  cards,
}: {
  title?: string;
  cards: { word: string; phonetic?: string; pos?: string; meaning: string; example?: string; emoji?: string }[];
}) {
  const { say } = useSpeak();
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  return (
    <div>
      {title && <h3 className="mb-3 text-lg font-bold">{title}</h3>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => {
          const isFlipped = !!flipped[i];
          return (
            <div
              key={i}
              onClick={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))}
              className={clsx(
                'panel panel-hover cursor-pointer p-5 flex flex-col justify-between min-h-[168px]',
                isFlipped && 'border-cyan/60 bg-cyan/5',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xl">{c.emoji ?? '📘'}</span>
                  <h4 className="mt-1 font-display text-lg font-bold text-ink">{c.word}</h4>
                  <p className="text-xs text-muted">
                    {c.pos} {c.phonetic && <span className="ml-1 font-mono text-cyan">{c.phonetic}</span>}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Pronounce ${c.word}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    say(c.word);
                  }}
                  className="rounded-xl bg-surface-2 p-2 text-cyan hover:bg-cyan/20"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 border-t border-line/60 pt-3 text-sm">
                {isFlipped ? (
                  <>
                    <p className="font-semibold text-ink">{c.meaning}</p>
                    {c.example && <p className="mt-1 text-xs italic text-muted">“{c.example}”</p>}
                  </>
                ) : (
                  <p className="text-xs font-semibold text-cyan">Tap card to reveal meaning & example →</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DialogueBlock({ title, context, lines }: { title?: string; context?: string; lines: { speaker: string; text: string }[] }) {
  const { say } = useSpeak();
  const playAll = () => say(lines.map((l) => `${l.speaker} says: ${l.text}`).join('. '));
  return (
    <div className="panel p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          {title && <h3 className="text-lg font-bold">{title}</h3>}
          {context && <p className="text-xs text-muted">{context}</p>}
        </div>
        <Button variant="outline" size="sm" icon={<Volume2 className="h-4 w-4" />} onClick={playAll}>
          Listen All
        </Button>
      </div>
      <div className="space-y-3">
        {lines.map((l, i) => (
          <div key={i} className={clsx('flex gap-3', i % 2 === 1 && 'flex-row-reverse text-right')}>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-bold text-cyan">
              {l.speaker.slice(0, 2).toUpperCase()}
            </div>
            <div className={clsx('max-w-[82%] rounded-2xl border border-line bg-surface-2/60 px-4 py-3', i % 2 === 1 && 'border-cyan/30 bg-cyan/10')}>
              <div className="mb-1 flex items-center gap-2 text-xs font-bold text-muted">
                <span>{l.speaker}</span>
                <button type="button" aria-label="Play line" onClick={() => say(l.text)} className="text-cyan hover:underline">
                  🔊
                </button>
              </div>
              <p className="text-sm">{l.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReadingBlock({
  title,
  passage,
  glossary,
  onAskAi,
}: {
  title: string;
  passage: string;
  glossary?: { word: string; meaning: string }[];
  onAskAi?: (prompt: string) => void;
}) {
  const { say, stop, speaking } = useSpeak();
  return (
    <div className="panel p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold">{title}</h3>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Volume2 className="h-4 w-4" />} onClick={() => (speaking ? stop() : say(passage))}>
            {speaking ? 'Stop Audio' : 'Read Aloud'}
          </Button>
          {onAskAi && (
            <Button variant="outline" size="sm" onClick={() => onAskAi(`Help me understand this reading passage:\n"${passage}"`)}>
              Ask AI Tutor
            </Button>
          )}
        </div>
      </div>
      <MarkdownText text={passage} className="rounded-2xl border border-line/70 bg-surface-2/40 p-5 leading-relaxed text-ink/95" />
      {glossary && glossary.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {glossary.map((g, i) => (
            <span key={i} className="rounded-xl border border-cyan/30 bg-cyan/10 px-3 py-1.5 text-xs">
              <strong className="text-cyan">{g.word}</strong>: {g.meaning}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AudioBlock({ title, text, transcriptHidden }: { title?: string; text: string; transcriptHidden?: boolean }) {
  const { say, stop, speaking } = useSpeak();
  const [showTranscript, setShowTranscript] = useState(!transcriptHidden);
  return (
    <div className="panel border-cyan/30 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Audio Player</p>
          {title && <h3 className="mt-0.5 text-lg font-bold">{title}</h3>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" icon={<Volume2 className="h-4 w-4" />} onClick={() => (speaking ? stop() : say(text, 0.9))}>
            {speaking ? 'Stop' : 'Play Audio'}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => say(text, 0.72)}>
            Slow (0.7x)
          </Button>
          {transcriptHidden && (
            <Button size="sm" variant="ghost" onClick={() => setShowTranscript((s) => !s)}>
              {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
            </Button>
          )}
        </div>
      </div>
      {showTranscript && <p className="mt-4 rounded-2xl bg-surface-2/60 p-4 text-sm leading-relaxed text-ink/90">{text}</p>}
    </div>
  );
}

function ExpandableBlock({ title, items }: { title?: string; items: { title: string; body: string }[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="panel p-6">
      {title && <h3 className="mb-4 text-lg font-bold">{title}</h3>}
      <div className="space-y-2.5">
        {items.map((it, i) => {
          const open = openIdx === i;
          return (
            <div key={i} className="overflow-hidden rounded-2xl border border-line bg-surface-2/40">
              <button
                type="button"
                onClick={() => setOpenIdx(open ? null : i)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left font-semibold hover:bg-surface-2/70"
              >
                <span>{it.title}</span>
                <ChevronDown className={clsx('h-4 w-4 text-muted transition-transform', open && 'rotate-180')} />
              </button>
              {open && (
                <div className="border-t border-line/60 px-4 py-3.5 text-sm text-ink/90">
                  <MarkdownText text={it.body} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SentenceBuilderBlock({ prompt, words, answer }: { prompt: string; words: string[]; answer: string }) {
  const [picked, setPicked] = useState<number[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  const built = picked.map((i) => words[i]).join(' ');

  const check = () => setChecked(built.trim().toLowerCase() === answer.trim().toLowerCase());
  const reset = () => {
    setPicked([]);
    setChecked(null);
  };

  return (
    <div className="panel border-neon/30 p-6">
      <p className="eyebrow mb-1">Interactive Activity</p>
      <p className="font-bold">{prompt}</p>
      <div className="mt-4 min-h-[56px] rounded-2xl border border-dashed border-line bg-surface-2/40 p-3 flex flex-wrap gap-2">
        {picked.length === 0 && <span className="text-sm text-muted">Tap words below to build the sentence...</span>}
        {picked.map((idx, pos) => (
          <button
            key={pos}
            type="button"
            onClick={() => {
              setPicked((p) => p.filter((_, x) => x !== pos));
              setChecked(null);
            }}
            className="rounded-xl bg-cyan/20 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-danger/20"
          >
            {words[idx]}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {words.map((w, idx) => {
          const used = picked.includes(idx);
          return (
            <button
              key={idx}
              type="button"
              disabled={used}
              onClick={() => {
                setPicked((p) => [...p, idx]);
                setChecked(null);
              }}
              className={clsx(
                'rounded-xl border border-line px-3 py-1.5 text-sm font-medium transition',
                used ? 'opacity-30' : 'bg-surface-2 hover:border-cyan',
              )}
            >
              {w}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={check} disabled={picked.length === 0}>
          Check Sentence
        </Button>
        <Button size="sm" variant="ghost" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={reset}>
          Reset
        </Button>
        {checked !== null && (
          <span className={clsx('text-sm font-bold', checked ? 'text-success' : 'text-danger')}>
            {checked ? '✓ Perfect word order!' : `Not quite — expected: "${answer}"`}
          </span>
        )}
      </div>
    </div>
  );
}

function QuickCheckBlock({ question, options, answer, explanation }: { question: string; options: string[]; answer: string; explanation: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="panel border-cyan/30 bg-surface-2/30 p-6">
      <p className="eyebrow mb-1">Quick Check</p>
      <MarkdownText text={question} className="font-bold" />
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const isSelected = selected === opt;
          const right = opt === answer;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => setSelected(opt)}
              className={clsx(
                'rounded-2xl border p-3.5 text-left text-sm font-medium transition',
                !selected && 'border-line bg-surface hover:border-cyan',
                selected && right && 'border-success bg-success/15 text-success',
                selected && isSelected && !right && 'border-danger bg-danger/15 text-danger',
                selected && !isSelected && !right && 'border-line/50 opacity-55',
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selected && (
        <div className={clsx('mt-4 rounded-2xl p-3.5 text-sm', selected === answer ? 'bg-success/10 text-success' : 'bg-warning/10 text-ink')}>
          <MarkdownText text={explanation} />
        </div>
      )}
    </div>
  );
}

function SortBlock({ prompt, buckets, items }: { prompt: string; buckets: string[]; items: { text: string; bucket: string }[] }) {
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [activeBucket, setActiveBucket] = useState(buckets[0]);
  const [checked, setChecked] = useState(false);

  return (
    <div className="panel p-6">
      <p className="eyebrow mb-1">Interactive Sorting</p>
      <p className="font-bold">{prompt}</p>
      <p className="mt-1 text-xs text-muted">1. Pick a category bucket, then tap cards to sort them into it.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {buckets.map((bName) => (
          <button
            key={bName}
            type="button"
            onClick={() => setActiveBucket(bName)}
            className={clsx(
              'rounded-xl px-4 py-2 text-sm font-bold transition',
              activeBucket === bName ? 'bg-brand-gradient text-white shadow-glow' : 'border border-line bg-surface-2 text-muted',
            )}
          >
            {bName} ({items.filter((i) => placed[i.text] === bName).length})
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((it) => {
          const cur = placed[it.text];
          const ok = cur === it.bucket;
          return (
            <button
              key={it.text}
              type="button"
              onClick={() => {
                setPlaced((p) => ({ ...p, [it.text]: activeBucket }));
                setChecked(false);
              }}
              className={clsx(
                'rounded-2xl border px-3.5 py-2 text-sm font-semibold transition',
                !cur && 'border-line bg-surface-2 hover:border-cyan',
                cur && !checked && 'border-cyan/60 bg-cyan/10',
                checked && ok && 'border-success bg-success/15 text-success',
                checked && !ok && 'border-danger bg-danger/15 text-danger',
              )}
            >
              {it.text} {cur && <span className="ml-1 text-xs opacity-75">→ {cur}</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={() => setChecked(true)} disabled={Object.keys(placed).length < items.length}>
          Check Sorting
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setPlaced({});
            setChecked(false);
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

function SpeakingBlock({ prompt, sample, tips, lessonId }: { prompt: string; sample: string; tips?: string[]; lessonId?: string }) {
  const { say } = useSpeak();
  const rec = useSpeechRecognition('en-US');
  const [manualText, setManualText] = useState('');
  const [saved, setSaved] = useState(false);

  const spoken = rec.transcript || manualText;
  const similarity = spoken ? Math.round(speechSimilarity(sample, spoken) * 100) : null;

  const logPractice = async () => {
    try {
      const res = await api.post<{ reward: RewardSummary }>('/learning/activity', {
        kind: 'SPEAKING',
        title: `Speaking practice: ${prompt.slice(0, 50)}`,
        refId: lessonId,
        score: similarity ?? 85,
      });
      setSaved(true);
      celebrate(res.reward, 'Speaking Logged!');
    } catch {
      toast.error('Please sign in to log speaking rewards.');
    }
  };

  return (
    <div className="panel border-orange-400/30 bg-orange-500/5 p-6">
      <p className="eyebrow text-orange-400 mb-1">Speaking Practice</p>
      <p className="font-bold">{prompt}</p>
      <div className="mt-3 rounded-2xl border border-line bg-surface-2/60 p-4 text-sm">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Model Phrase</span>
          <button type="button" onClick={() => say(sample)} className="flex items-center gap-1 text-xs font-bold text-cyan hover:underline">
            <Volume2 className="h-3.5 w-3.5" /> Hear Model
          </button>
        </div>
        <p className="italic">“{sample}”</p>
      </div>

      {tips && (
        <ul className="mt-3 space-y-1 text-xs text-muted">
          {tips.map((t, i) => (
            <li key={i}>• {t}</li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {rec.supported ? (
          <Button
            size="sm"
            variant={rec.listening ? 'danger' : 'primary'}
            icon={rec.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            onClick={() => (rec.listening ? rec.stop() : rec.start())}
          >
            {rec.listening ? 'Stop Recording' : 'Speak into Microphone'}
          </Button>
        ) : (
          <input
            className="input text-sm"
            placeholder="Speech recognition unavailable in this browser — type your spoken sentence to score match..."
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
          />
        )}

        {spoken && (
          <Button size="sm" variant="success" disabled={saved} onClick={logPractice}>
            {saved ? '✓ Logged' : 'Save Speaking (+10 XP)'}
          </Button>
        )}
      </div>

      {rec.error && <p className="mt-2 text-xs text-danger">{rec.error}</p>}
      {spoken && (
        <div className="mt-3 rounded-2xl border border-line bg-surface p-3.5 text-sm">
          <p className="text-xs font-bold text-muted">What you said:</p>
          <p className="mt-0.5">“{spoken}”</p>
          {similarity !== null && (
            <p className={clsx('mt-1 text-xs font-bold', similarity >= 65 ? 'text-success' : 'text-warning')}>
              Phrase match score: {similarity}%
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function WritingBlock({
  prompt,
  minWords,
  checklist,
  modelAnswer,
  lessonId,
  onAskAi,
}: {
  prompt: string;
  minWords: number;
  checklist?: string[];
  modelAnswer?: string;
  lessonId?: string;
  onAskAi?: (prompt: string) => void;
}) {
  const [text, setText] = useState('');
  const [showModel, setShowModel] = useState(false);
  const [saved, setSaved] = useState(false);
  const words = text.trim().split(/\s+/).filter(Boolean).length;

  const saveWriting = async () => {
    try {
      const res = await api.post<{ reward: RewardSummary }>('/learning/activity', {
        kind: 'WRITING',
        title: `Writing task (${words} words)`,
        refId: lessonId,
        score: words >= minWords ? 90 : 70,
      });
      setSaved(true);
      celebrate(res.reward, 'Writing Logged!');
    } catch {
      toast.error('Please sign in to save writing practice.');
    }
  };

  return (
    <div className="panel border-warning/30 bg-warning/5 p-6">
      <p className="eyebrow text-warning mb-1">Writing Workshop</p>
      <MarkdownText text={prompt} className="font-bold" />
      {checklist && (
        <ul className="mt-3 space-y-1 text-xs text-muted">
          {checklist.map((c, i) => (
            <li key={i}>☐ {c}</li>
          ))}
        </ul>
      )}
      <textarea
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Write at least ${minWords} words here...`}
        className="input mt-4 text-sm"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className={clsx('text-xs font-bold', words >= minWords ? 'text-success' : 'text-muted')}>
          {words} / {minWords} words
        </span>
        <div className="flex flex-wrap gap-2">
          {onAskAi && (
            <Button size="sm" variant="outline" disabled={words < 5} onClick={() => onAskAi(`Please review and give feedback on my English writing:\n\n${text}`)}>
              Get AI Feedback
            </Button>
          )}
          {modelAnswer && (
            <Button size="sm" variant="ghost" onClick={() => setShowModel((s) => !s)}>
              {showModel ? 'Hide Model' : 'View Model Answer'}
            </Button>
          )}
          <Button size="sm" variant="success" disabled={words < minWords || saved} onClick={saveWriting}>
            {saved ? '✓ Saved' : 'Submit Draft (+10 XP)'}
          </Button>
        </div>
      </div>
      {showModel && modelAnswer && (
        <div className="mt-4 rounded-2xl border border-line bg-surface p-4 text-sm whitespace-pre-line">
          <p className="mb-1 text-xs font-bold text-cyan">Model Example</p>
          {modelAnswer}
        </div>
      )}
    </div>
  );
}
