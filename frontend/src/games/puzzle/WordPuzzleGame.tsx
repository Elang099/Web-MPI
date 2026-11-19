import { useEffect, useState } from 'react';
import type { PublicQuestion } from '@fec/shared';
import { Check, Puzzle, RotateCcw } from 'lucide-react';
import { api } from '@/services/api';
import { celebrate, toast } from '@/stores/ui';
import { gameAudio } from '../core/audioManager';
import { GameHudBar, GameOverlayModal, type GameResultSummary, type GameState } from '../core/GameStateMachine';
import { GameQuestionPrompt } from '../core/GameQuestionPrompt';
import { AvatarRenderer, type AvatarConfig } from '../AvatarRenderer';

type PuzzleMode = 'scramble' | 'wordsearch' | 'memory' | 'grammar';

const SCRAMBLE_WORDS = [
  { word: 'RESILIENT', hint: 'Able to recover quickly from difficulties' },
  { word: 'ITINERARY', hint: 'A planned travel schedule and route' },
  { word: 'COLLABORATE', hint: 'Work together toward a shared goal' },
  { word: 'CONCISE', hint: 'Giving lots of clarity in few words' },
  { word: 'FLUENCY', hint: 'Smooth, natural expression in a language' },
];

const MEMORY_PAIRS = [
  { id: '1', word: 'Break the ice', match: 'Start warm conversation' },
  { id: '2', word: 'Piece of cake', match: 'Very easy to do' },
  { id: '3', word: 'Figure out', match: 'Solve or understand' },
  { id: '4', word: 'Abundant', match: 'Opposite of scarce' },
  { id: '5', word: 'Itinerary', match: 'Travel schedule' },
  { id: '6', word: 'Deadline', match: 'Final due date' },
];

const WORD_SEARCH_TARGET = ['LEARN', 'FLUENT', 'IDIOM', 'VERB'];
const WORD_SEARCH_GRID = [
  ['L', 'E', 'A', 'R', 'N', 'X'],
  ['F', 'L', 'U', 'E', 'N', 'T'],
  ['Q', 'I', 'D', 'I', 'O', 'M'],
  ['K', 'V', 'E', 'R', 'B', 'P'],
  ['S', 'P', 'E', 'A', 'K', 'Z'],
];

function scramble(word: string) {
  return word.split('').sort(() => Math.random() - 0.5).join('');
}

export function WordPuzzleGame() {
  const [mode, setMode] = useState<PuzzleMode>('scramble');
  const [state, setState] = useState<GameState>('MENU');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [result, setResult] = useState<GameResultSummary | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Scramble state
  const [scrIdx, setScrIdx] = useState(0);
  const [scrInput, setScrInput] = useState('');
  const [scrMixed, setScrMixed] = useState(() => scramble(SCRAMBLE_WORDS[0].word));

  // Memory state
  const [cards, setCards] = useState<{ uid: string; pairId: string; text: string; matched: boolean }[]>([]);
  const [flippedIdx, setFlippedIdx] = useState<number[]>([]);

  // Word Search state
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  // Grammar / Missing Word / Synonym Server Questions
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; response: string | string[] }[]>([]);
  const [avatar, setAvatar] = useState<AvatarConfig | null>(null);

  useEffect(() => {
    void api.get<{ avatar: AvatarConfig }>('/avatar').then((r) => setAvatar(r.avatar)).catch(() => undefined);
    return () => gameAudio.stopMusic();
  }, []);

  const startMode = async (chosenMode: PuzzleMode = mode) => {
    setMode(chosenMode);
    setState('LOADING');
    setScore(0);
    setStreak(0);
    setResult(null);
    setAnswers([]);

    try {
      const res = await api.post<{ sessionId: string; questions: PublicQuestion[] }>('/games/sessions/start', {
        gameSlug: 'word-puzzle',
        mode: chosenMode,
      });
      setSessionId(res.sessionId);
      setQuestions(res.questions);
      setQIdx(0);

      if (chosenMode === 'scramble') {
        setScrIdx(0);
        setScrInput('');
        setScrMixed(scramble(SCRAMBLE_WORDS[0].word));
      } else if (chosenMode === 'memory') {
        const deck = MEMORY_PAIRS.flatMap((p) => [
          { uid: `${p.id}-a`, pairId: p.id, text: p.word, matched: false },
          { uid: `${p.id}-b`, pairId: p.id, text: p.match, matched: false },
        ]).sort(() => Math.random() - 0.5);
        setCards(deck);
        setFlippedIdx([]);
      } else if (chosenMode === 'wordsearch') {
        setFoundWords([]);
        setSelectedRow(null);
      }

      setState('PLAYING');
      gameAudio.startMusic('puzzle');
    } catch (e) {
      toast.error((e as Error).message);
      setState('MENU');
    }
  };

  const finishGame = async (finalScore: number, submittedAnswers = answers) => {
    if (!sessionId) return;
    gameAudio.stopMusic();
    setState('RESULTS');
    try {
      const res = await api.post<GameResultSummary>(`/games/sessions/${sessionId}/finish`, {
        score: finalScore,
        answers: submittedAnswers,
        meta: { mode, completed: true },
      });
      setResult(res);
      gameAudio.victory();
      if (res.reward) celebrate(res.reward, 'Word Puzzle Complete!');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const submitScramble = (e: React.FormEvent) => {
    e.preventDefault();
    const target = SCRAMBLE_WORDS[scrIdx];
    if (scrInput.trim().toUpperCase() === target.word) {
      gameAudio.correct();
      const nextScore = score + 120;
      setScore(nextScore);
      setStreak((s) => s + 1);
      setScrInput('');
      if (scrIdx + 1 >= SCRAMBLE_WORDS.length) {
        // Also answer 1 quick bonus question or finish directly
        void finishGame(nextScore);
      } else {
        const nextIdx = scrIdx + 1;
        setScrIdx(nextIdx);
        setScrMixed(scramble(SCRAMBLE_WORDS[nextIdx].word));
      }
    } else {
      gameAudio.wrong();
      setStreak(0);
      toast.error('Not quite — check the hint and unscramble all letters!');
    }
  };

  const flipCard = (idx: number) => {
    if (flippedIdx.includes(idx) || cards[idx].matched || flippedIdx.length >= 2) return;
    gameAudio.flip();
    const next = [...flippedIdx, idx];
    setFlippedIdx(next);
    if (next.length === 2) {
      const [a, b] = [cards[next[0]], cards[next[1]]];
      if (a.pairId === b.pairId) {
        gameAudio.correct();
        const updated = cards.map((c, i) => (i === next[0] || i === next[1] ? { ...c, matched: true } : c));
        setCards(updated);
        const nextScore = score + 100;
        setScore(nextScore);
        setStreak((s) => s + 1);
        setTimeout(() => {
          setFlippedIdx([]);
          if (updated.every((c) => c.matched)) void finishGame(nextScore);
        }, 350);
      } else {
        gameAudio.wrong();
        setStreak(0);
        setTimeout(() => setFlippedIdx([]), 700);
      }
    }
  };

  const tapSearchRow = (rowIdx: number) => {
    setSelectedRow(rowIdx);
    const rowStr = WORD_SEARCH_GRID[rowIdx].join('');
    const matched = WORD_SEARCH_TARGET.find((w) => rowStr.includes(w) && !foundWords.includes(w));
    if (matched) {
      gameAudio.correct();
      const nextFound = [...foundWords, matched];
      setFoundWords(nextFound);
      const nextScore = score + 130;
      setScore(nextScore);
      setStreak((s) => s + 1);
      if (nextFound.length >= WORD_SEARCH_TARGET.length) {
        void finishGame(nextScore);
      }
    } else {
      gameAudio.step();
    }
  };

  const answerGrammarQ = (resp: string | string[]) => {
    const q = questions[qIdx];
    const next = [...answers, { questionId: q.id, response: resp }];
    setAnswers(next);
    const nextScore = score + 110;
    setScore(nextScore);
    gameAudio.coin();
    if (qIdx + 1 >= Math.min(6, questions.length)) {
      void finishGame(nextScore, next);
    } else {
      setQIdx(qIdx + 1);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <GameHudBar
        title="Word Puzzle Quest"
        state={state}
        score={score}
        streak={streak}
        extra={avatar ? <AvatarRenderer avatar={avatar} size={40} pose={streak > 1 ? 'celebrate' : 'idle'} /> : undefined}
      />

      {/* Mode Switcher */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { id: 'scramble' as const, label: '🔤 Word Scramble & Spelling' },
          { id: 'wordsearch' as const, label: '🔎 Word Search Grid' },
          { id: 'memory' as const, label: '🃏 Idiom & Synonym Memory' },
          { id: 'grammar' as const, label: '🧩 Missing Word & Grammar' },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => void startMode(m.id)}
            className={`rounded-2xl px-4 py-2 text-xs font-extrabold transition ${
              mode === m.id ? 'bg-gradient-to-r from-game-grape to-game-candy text-white shadow-game' : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="relative min-h-[420px] rounded-4xl border border-white/15 bg-gradient-to-br from-[#191D5C] to-[#0E133D] p-6 sm:p-8 shadow-2xl">
        {state === 'PLAYING' && mode === 'scramble' && (
          <div className="mx-auto max-w-md text-center space-y-5">
            <span className="text-xs font-extrabold text-game-sky">
              WORD {scrIdx + 1} OF {SCRAMBLE_WORDS.length}
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {scrMixed.split('').map((ch, i) => (
                <span key={i} className="grid h-12 w-10 place-items-center rounded-2xl bg-gradient-to-b from-game-grape to-purple-700 font-game text-xl font-black shadow-game">
                  {ch}
                </span>
              ))}
            </div>
            <p className="text-sm text-white/80">Hint: {SCRAMBLE_WORDS[scrIdx].hint}</p>
            <form onSubmit={submitScramble} className="space-y-3">
              <input
                className="input text-center text-lg font-bold uppercase tracking-widest text-white"
                placeholder="Type the unscrambled word..."
                value={scrInput}
                onChange={(e) => setScrInput(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2 justify-center">
                <button type="button" onClick={() => setScrMixed(scramble(SCRAMBLE_WORDS[scrIdx].word))} className="btn-game bg-white/15 text-sm">
                  <RotateCcw className="h-4 w-4" /> Shuffle
                </button>
                <button type="submit" className="btn-game bg-gradient-to-r from-game-grass to-emerald-500 text-sm">
                  <Check className="h-4 w-4" /> Check Word
                </button>
              </div>
            </form>
          </div>
        )}

        {state === 'PLAYING' && mode === 'wordsearch' && (
          <div className="mx-auto max-w-md space-y-4 text-center">
            <p className="text-sm font-bold text-game-sky">Tap rows containing hidden English words!</p>
            <div className="flex flex-wrap justify-center gap-2">
              {WORD_SEARCH_TARGET.map((w) => (
                <span key={w} className={`rounded-xl px-3 py-1 text-xs font-extrabold ${foundWords.includes(w) ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/75'}`}>
                  {foundWords.includes(w) ? '✓ ' : ''}
                  {w}
                </span>
              ))}
            </div>
            <div className="space-y-2">
              {WORD_SEARCH_GRID.map((row, rIdx) => (
                <button
                  key={rIdx}
                  onClick={() => tapSearchRow(rIdx)}
                  className={`grid w-full grid-cols-6 gap-2 rounded-2xl p-1.5 transition ${selectedRow === rIdx ? 'bg-game-sky/20' : 'hover:bg-white/10'}`}
                >
                  {row.map((ch, cIdx) => (
                    <span key={cIdx} className="grid aspect-square place-items-center rounded-xl bg-white/10 font-game text-lg font-black">
                      {ch}
                    </span>
                  ))}
                </button>
              ))}
            </div>
          </div>
        )}

        {state === 'PLAYING' && mode === 'memory' && (
          <div>
            <p className="mb-4 text-center text-sm font-bold text-game-sky">Flip cards to match each Idiom or Word with its Meaning!</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {cards.map((c, idx) => {
                const open = c.matched || flippedIdx.includes(idx);
                return (
                  <button
                    key={c.uid}
                    onClick={() => flipCard(idx)}
                    className={`flex min-h-[84px] items-center justify-center rounded-2xl border p-2.5 text-center text-xs font-extrabold transition ${
                      c.matched
                        ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                        : open
                          ? 'border-game-sky bg-game-sky/25 text-white'
                          : 'border-white/15 bg-white/10 text-game-sun hover:bg-white/20'
                    }`}
                  >
                    {open ? c.text : <Puzzle className="h-6 w-6 opacity-70" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {state === 'PLAYING' && mode === 'grammar' && questions[qIdx] && (
          <div className="mx-auto max-w-lg space-y-4">
            <span className="text-xs font-extrabold text-game-sky">
              PUZZLE {qIdx + 1} OF {Math.min(6, questions.length)}
            </span>
            <GameQuestionPrompt key={questions[qIdx].id} question={questions[qIdx]} submitLabel="Submit Puzzle" onSubmit={answerGrammarQ} />
          </div>
        )}

        <GameOverlayModal
          state={state}
          title="Word Puzzle Quest"
          subtitle="Pick any puzzle mode — Scramble, Word Search, Idiom Memory Cards, or Grammar Puzzles — and rack up streaks!"
          result={result}
          onStart={() => void startMode(mode)}
          onRestart={() => void startMode(mode)}
        />
      </div>
    </div>
  );
}
