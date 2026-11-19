import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LEVELS, type RewardSummary } from '@fec/shared';
import { Check, Layers, RotateCw, Search, Star, Volume2, X } from 'lucide-react';
import { api } from '@/services/api';
import { celebrate, toast } from '@/stores/ui';
import { useAuth } from '@/stores/auth';
import { useSpeak } from '@/hooks/useSpeech';
import { EmptyState, ErrorState, PageHeader, PageLoader, Tabs } from '@/components/ui';
import { Button } from '@/components/ui/Button';

interface VocabItem {
  id: string;
  word: string;
  phonetic?: string | null;
  partOfSpeech: string;
  meaning: string;
  example?: string | null;
  category: string;
  level: string;
  synonyms: string[];
  antonyms: string[];
  emoji?: string | null;
  strength: number;
}

const VOCAB_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'daily', label: 'Daily Life' },
  { value: 'school', label: 'School' },
  { value: 'academic', label: 'Academic' },
  { value: 'workplace', label: 'Workplace' },
  { value: 'business', label: 'Business' },
  { value: 'technology', label: 'Technology' },
  { value: 'travel', label: 'Travel' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'phrasal', label: 'Phrasal Verbs' },
  { value: 'idiom', label: 'Idioms' },
  { value: 'collocation', label: 'Collocations' },
];

export function VocabularyPage() {
  const { user } = useAuth();
  const { say } = useSpeak();
  const qc = useQueryClient();
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [q, setQ] = useState('');
  const [mode, setMode] = useState<'deck' | 'grid'>('deck');
  const [deckIdx, setDeckIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['vocabulary', category, level, q],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (category) qs.set('category', category);
      if (level) qs.set('level', level);
      if (q) qs.set('q', q);
      return api.get<{ words: VocabItem[] }>(`/learning/vocabulary?${qs.toString()}`);
    },
  });

  const reviewMut = useMutation({
    mutationFn: ({ id, knew }: { id: string; knew: boolean }) => api.post<{ strength: number; reward: RewardSummary }>(`/learning/vocabulary/${id}/review`, { knew }),
    onSuccess: (res) => {
      celebrate(res.reward, 'Word Reviewed');
      setFlipped(false);
      setDeckIdx((i) => i + 1);
      void qc.invalidateQueries({ queryKey: ['vocabulary'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const words = data?.words ?? [];
  const activeWord = words.length ? words[deckIdx % words.length] : null;

  return (
    <div>
      <PageHeader
        eyebrow="Vocabulary Lab"
        title="Interactive Word Cards & Flashcards"
        subtitle="Hear native pronunciation, inspect synonyms & antonyms, and build long-term memory with spaced repetition."
        actions={
          <Tabs
            value={mode}
            onChange={setMode}
            tabs={[
              { value: 'deck', label: 'Flashcard Deck' },
              { value: 'grid', label: 'Browse All Words' },
            ]}
          />
        }
      />

      {/* Filter bar */}
      <div className="panel mb-6 grid gap-3 p-4 sm:grid-cols-12">
        <div className="relative sm:col-span-5">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input pl-10 py-2.5 text-sm" placeholder="Search English words or meanings..." value={q} onChange={(e) => { setQ(e.target.value); setDeckIdx(0); }} />
        </div>
        <select className="input py-2.5 text-sm sm:col-span-4" value={category} onChange={(e) => { setCategory(e.target.value); setDeckIdx(0); }}>
          {VOCAB_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select className="input py-2.5 text-sm sm:col-span-3" value={level} onChange={(e) => { setLevel(e.target.value); setDeckIdx(0); }}>
          <option value="">All Levels</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !words.length ? (
        <EmptyState icon={<Layers className="h-6 w-6" />} title="No words found" body="Try another search keyword or category." />
      ) : mode === 'deck' && activeWord ? (
        <div className="mx-auto max-w-xl">
          <div className="mb-3 flex items-center justify-between text-xs font-bold text-muted">
            <span>
              Card {(deckIdx % words.length) + 1} of {words.length} · {activeWord.category.toUpperCase()}
            </span>
            <span className="flex items-center gap-1 text-warning">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < activeWord.strength ? 'fill-warning text-warning' : 'text-line'}`} />
              ))}
            </span>
          </div>

          <div
            onClick={() => setFlipped((f) => !f)}
            className="panel panel-hover flex min-h-[300px] cursor-pointer flex-col justify-between border-cyan/40 p-8 text-center"
          >
            <div className="flex items-center justify-between">
              <span className="chip">{activeWord.partOfSpeech}</span>
              <button
                type="button"
                aria-label="Pronounce word"
                onClick={(e) => {
                  e.stopPropagation();
                  say(activeWord.word);
                }}
                className="rounded-xl bg-surface-2 p-2.5 text-cyan hover:bg-cyan/20"
              >
                <Volume2 className="h-5 w-5" />
              </button>
            </div>

            {!flipped ? (
              <div className="my-6">
                <span className="text-4xl">{activeWord.emoji ?? '📘'}</span>
                <h2 className="mt-3 font-display text-4xl font-bold">{activeWord.word}</h2>
                {activeWord.phonetic && <p className="mt-1 font-mono text-sm text-cyan">{activeWord.phonetic}</p>}
                <p className="mt-6 text-xs font-semibold text-muted">Tap card to reveal definition & examples</p>
              </div>
            ) : (
              <div className="my-4 space-y-3 text-left">
                <p className="text-xl font-bold text-cyan">{activeWord.meaning}</p>
                {activeWord.example && (
                  <div className="rounded-2xl bg-surface-2/60 p-3.5 text-sm">
                    <span className="block text-[11px] font-bold uppercase text-muted">Example</span>
                    <span className="italic">“{activeWord.example}”</span>
                  </div>
                )}
                {activeWord.synonyms.length > 0 && (
                  <p className="text-xs text-muted">
                    <strong>Synonyms:</strong> {activeWord.synonyms.join(', ')}
                  </p>
                )}
                {activeWord.antonyms.length > 0 && (
                  <p className="text-xs text-muted">
                    <strong>Antonyms:</strong> {activeWord.antonyms.join(', ')}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 text-xs text-muted">
              <RotateCw className="h-3.5 w-3.5" /> Tap card to flip
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              size="lg"
              icon={<X className="h-4 w-4 text-danger" />}
              disabled={reviewMut.isPending}
              onClick={() => {
                if (user) reviewMut.mutate({ id: activeWord.id, knew: false });
                else {
                  setFlipped(false);
                  setDeckIdx((i) => i + 1);
                }
              }}
            >
              Still Learning
            </Button>
            <Button
              variant="success"
              size="lg"
              icon={<Check className="h-4 w-4" />}
              disabled={reviewMut.isPending}
              onClick={() => {
                if (user) reviewMut.mutate({ id: activeWord.id, knew: true });
                else {
                  setFlipped(false);
                  setDeckIdx((i) => i + 1);
                }
              }}
            >
              Got It! (+3 XP)
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {words.map((w) => (
            <div key={w.id} className="panel flex flex-col justify-between p-5">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xl">{w.emoji ?? '📘'}</span>
                    <h3 className="mt-1 font-display text-lg font-bold">{w.word}</h3>
                    <p className="text-xs text-muted">
                      {w.partOfSpeech} {w.phonetic && <span className="ml-1 font-mono text-cyan">{w.phonetic}</span>}
                    </p>
                  </div>
                  <button onClick={() => say(w.word)} aria-label={`Pronounce ${w.word}`} className="rounded-xl bg-surface-2 p-2 text-cyan hover:bg-cyan/15">
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 text-sm font-medium">{w.meaning}</p>
                {w.example && <p className="mt-1.5 text-xs italic text-muted">“{w.example}”</p>}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3 text-xs">
                <span className="chip">{w.category}</span>
                <span className="text-warning">{'★'.repeat(w.strength)}{'☆'.repeat(5 - w.strength)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
