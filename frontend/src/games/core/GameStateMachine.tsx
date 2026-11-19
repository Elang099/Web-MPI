import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Coins, Pause, Play, RotateCcw, Sparkles, Trophy, Zap } from 'lucide-react';
import type { GradedAnswer, RewardSummary } from '@fec/shared';

export type GameState = 'LOADING' | 'MENU' | 'READY' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'RESULTS';

export interface GameResultSummary {
  score: number;
  distance?: number;
  correct: number;
  wrong: number;
  graded?: GradedAnswer[];
  resourcesEarned?: { bricks: number; wood: number; books: number; energy: number };
  reward?: RewardSummary;
}

export function GameHudBar({
  title,
  state,
  score,
  streak,
  lives,
  extra,
  onPauseToggle,
}: {
  title: string;
  state: GameState;
  score: number;
  streak?: number;
  lives?: number;
  extra?: ReactNode;
  onPauseToggle?: () => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/15 bg-[#121B4D]/90 px-4 py-3 shadow-soft backdrop-blur">
      <div className="flex items-center gap-3">
        <Link to="/games" className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Back to Game Center">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-game text-lg font-black leading-none text-white sm:text-xl">{title}</h1>
          <span className="text-[11px] font-bold uppercase tracking-wider text-game-sky">{state.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="rounded-2xl bg-white/10 px-3 py-1.5 text-sm font-extrabold text-game-sun">
          ⭐ {score.toLocaleString()}
        </div>
        {typeof streak === 'number' && streak > 0 && (
          <div className="rounded-2xl bg-game-candy/25 px-3 py-1.5 text-xs font-extrabold text-white">🔥 x{streak}</div>
        )}
        {typeof lives === 'number' && (
          <div className="rounded-2xl bg-white/10 px-3 py-1.5 text-sm font-extrabold text-rose-400">
            {'❤️'.repeat(Math.max(0, lives)) || '💔'}
          </div>
        )}
        {extra}
        {onPauseToggle && (state === 'PLAYING' || state === 'PAUSED') && (
          <button onClick={onPauseToggle} className="btn-game bg-game-grape px-3.5 py-2 text-xs">
            {state === 'PAUSED' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            <span className="hidden sm:inline">{state === 'PAUSED' ? 'Resume' : 'Pause'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function GameOverlayModal({
  state,
  title,
  subtitle,
  result,
  onStart,
  onResume,
  onRestart,
  menuExtra,
}: {
  state: GameState;
  title: string;
  subtitle: string;
  result?: GameResultSummary | null;
  onStart: () => void;
  onResume?: () => void;
  onRestart: () => void;
  menuExtra?: ReactNode;
}) {
  if (state === 'PLAYING' || state === 'READY') return null;

  return (
    <div className="absolute inset-0 z-30 grid place-items-center rounded-3xl bg-[#06091E]/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-4xl border border-white/20 bg-gradient-to-b from-[#1A2464] to-[#0E1540] p-6 text-center text-white shadow-2xl animate-pop-in">
        {state === 'LOADING' && (
          <>
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-game-sky border-t-transparent" />
            <h2 className="font-game text-2xl font-black">Loading {title}...</h2>
            <p className="mt-1 text-sm text-white/75">Preparing server-verified English challenges.</p>
          </>
        )}

        {state === 'MENU' && (
          <>
            <span className="inline-block rounded-full bg-game-sky/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-game-sky">
              Ready to Play
            </span>
            <h2 className="mt-3 font-game text-3xl font-black">{title}</h2>
            <p className="mt-2 text-sm text-white/80">{subtitle}</p>
            {menuExtra && <div className="mt-4 text-left">{menuExtra}</div>}
            <button onClick={onStart} className="btn-game mt-6 w-full bg-gradient-to-r from-game-grass to-emerald-500">
              <Play className="h-5 w-5 fill-current" /> Start Game
            </button>
          </>
        )}

        {state === 'PAUSED' && (
          <>
            <h2 className="font-game text-3xl font-black">Game Paused</h2>
            <p className="mt-1 text-sm text-white/75">Take a breather — your progress is safe.</p>
            <div className="mt-6 flex flex-col gap-3">
              {onResume && (
                <button onClick={onResume} className="btn-game bg-gradient-to-r from-game-sky to-blue-500">
                  <Play className="h-5 w-5 fill-current" /> Resume
                </button>
              )}
              <button onClick={onRestart} className="btn-game bg-white/15">
                <RotateCcw className="h-5 w-5" /> Restart Run
              </button>
            </div>
          </>
        )}

        {(state === 'GAME_OVER' || state === 'RESULTS') && (
          <>
            <Trophy className="mx-auto h-12 w-12 text-game-sun" />
            <h2 className="mt-2 font-game text-3xl font-black">{state === 'GAME_OVER' ? 'Run Finished!' : 'Mission Results!'}</h2>
            {result ? (
              <div className="mt-4 space-y-3 text-left">
                <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/10 p-3 text-center">
                  <div>
                    <span className="block text-[11px] text-white/70">Score</span>
                    <span className="font-game text-lg font-black text-game-sun">{result.score.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-white/70">Correct</span>
                    <span className="font-game text-lg font-black text-game-grass">{result.correct}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-white/70">{typeof result.distance === 'number' ? 'Distance' : 'Wrong'}</span>
                    <span className="font-game text-lg font-black text-game-sky">
                      {typeof result.distance === 'number' ? `${result.distance}m` : result.wrong}
                    </span>
                  </div>
                </div>

                {result.reward && (
                  <div className="flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-game-sky/30 bg-game-sky/15 p-3 text-sm font-extrabold">
                    <span className="flex items-center gap-1 text-game-sky">
                      <Zap className="h-4 w-4" /> +{result.reward.xp} XP
                    </span>
                    <span className="flex items-center gap-1 text-game-sun">
                      <Coins className="h-4 w-4" /> +{result.reward.coins} Coins
                    </span>
                    {result.resourcesEarned && (
                      <span className="flex items-center gap-1 text-xs text-emerald-300">
                        <Sparkles className="h-3.5 w-3.5" /> +{result.resourcesEarned.bricks} Bricks · +{result.resourcesEarned.books} Books
                      </span>
                    )}
                  </div>
                )}

                {result.graded && result.graded.length > 0 && (
                  <div className="max-h-36 space-y-1.5 overflow-y-auto rounded-2xl bg-black/25 p-3 text-xs">
                    {result.graded.map((g, idx) => (
                      <div key={idx} className={g.isCorrect ? 'text-emerald-300' : 'text-rose-300'}>
                        {g.isCorrect ? '✓' : '✗'} {String(g.correctAnswer)} — <span className="text-white/75">{g.explanation}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-white/75">Saving your score & rewards...</p>
            )}
            <div className="mt-5 flex gap-3">
              <Link to="/games" className="btn-game flex-1 bg-white/15 text-sm">
                Arcade Hub
              </Link>
              <button onClick={onRestart} className="btn-game flex-1 bg-gradient-to-r from-game-candy to-game-grape text-sm">
                <RotateCcw className="h-4 w-4" /> Play Again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
