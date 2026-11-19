import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, MessageCircle, Music, Sparkles, Star, Volume2 } from 'lucide-react';
import type { PublicQuestion } from '@fec/shared';
import { api } from '@/services/api';
import { celebrate, toast } from '@/stores/ui';
import { useSpeak } from '@/hooks/useSpeech';
import { AvatarRenderer, type AvatarConfig } from '../AvatarRenderer';
import { gameAudio } from '../core/audioManager';
import { GameHudBar, GameOverlayModal, type GameResultSummary, type GameState } from '../core/GameStateMachine';

interface SceneSpec {
  id: string;
  name: string;
  emoji: string;
  sky: string;
  floor: string;
  decorEmojis: [string, string, string];
  npcName: string;
  npcRole: string;
  npcEmoji: string;
  turns: {
    npcLine: string;
    choices: { text: string; natural: boolean; feedback: string }[];
  }[];
}

const SCENES: SceneSpec[] = [
  {
    id: 'restaurant',
    name: 'Restaurant',
    emoji: '🍽️',
    sky: 'from-[#3B1810] via-[#5C2512] to-[#26110B]',
    floor: 'bg-[#422006]/80 border-amber-500/30',
    decorEmojis: ['🕯️', '🍷', '🥐'],
    npcName: 'Chef Leo',
    npcRole: 'Server',
    npcEmoji: '👨‍🍳',
    turns: [
      {
        npcLine: 'Good evening and welcome! Table for one? Would you like to start with an appetizer or a beverage?',
        choices: [
          { text: 'Yes, please! Could I have an iced lemon tea and garlic bread as an appetizer?', natural: true, feedback: 'Warm, polite, and uses restaurant vocabulary naturally!' },
          { text: 'Give tea bread fast.', natural: false, feedback: 'Too blunt! Try "Could I have..., please?" for polite dining English.' },
        ],
      },
      {
        npcLine: 'Certainly! Anything else before I place your main course order?',
        choices: [
          { text: 'Could you also bring the check with a receipt after dessert? Thank you!', natural: true, feedback: 'Crystal clear and appreciative!' },
          { text: 'No understand.', natural: false, feedback: 'Try "I’m all set for now, thank you!"' },
        ],
      },
    ],
  },
  {
    id: 'mall',
    name: 'Shopping Mall',
    emoji: '🛍️',
    sky: 'from-[#3D1242] via-[#5B1D63] to-[#220B38]',
    floor: 'bg-purple-950/80 border-pink-400/30',
    decorEmojis: ['🧥', '👟', '🏷️'],
    npcName: 'Maya',
    npcRole: 'Store Clerk',
    npcEmoji: '👩‍💼',
    turns: [
      {
        npcLine: 'Hi there! Looking for a specific jacket size today?',
        choices: [
          { text: 'Yes, I’m looking for this hoodie in a medium. Could I try it on in the fitting room?', natural: true, feedback: 'Natural phrasal verb ("try it on") + polite question!' },
          { text: 'Shirt small bad.', natural: false, feedback: 'Try "Could I try a medium size, please?"' },
        ],
      },
    ],
  },
  {
    id: 'airport',
    name: 'Airport',
    emoji: '✈️',
    sky: 'from-[#0C2D57] via-[#134B7A] to-[#081C3A]',
    floor: 'bg-sky-950/80 border-cyan/30',
    decorEmojis: ['🛫', '🧳', '🛂'],
    npcName: 'Officer Tari',
    npcRole: 'Check-In Desk',
    npcEmoji: '🧑‍✈️',
    turns: [
      {
        npcLine: 'Welcome to Gate Check-In! May I see your passport and boarding pass, please?',
        choices: [
          { text: 'Here you go. Could you confirm whether Flight 402 is departing on time from Gate 11?', natural: true, feedback: 'Great airport fluency and clear confirmation!' },
          { text: 'Where plane go?', natural: false, feedback: 'Try "Could you confirm my departure gate and boarding time?"' },
        ],
      },
    ],
  },
  {
    id: 'school',
    name: 'School',
    emoji: '🏫',
    sky: 'from-[#0D3B32] via-[#145C4B] to-[#082420]',
    floor: 'bg-emerald-950/80 border-emerald-400/30',
    decorEmojis: ['📚', '🔬', '🎓'],
    npcName: 'Mr. Hadi',
    npcRole: 'Librarian',
    npcEmoji: '👨‍🏫',
    turns: [
      {
        npcLine: 'Good morning! Are you looking for reference books for your science assignment?',
        choices: [
          { text: 'Yes, sir! I’m researching vertical gardens—could you show me the ecology section?', natural: true, feedback: 'Respectful and specific!' },
          { text: 'Give book.', natural: false, feedback: 'Use "Could you help me find...?"' },
        ],
      },
    ],
  },
  {
    id: 'workplace',
    name: 'Workplace',
    emoji: '💼',
    sky: 'from-[#1B2252] via-[#28347A] to-[#111638]',
    floor: 'bg-indigo-950/80 border-indigo-400/30',
    decorEmojis: ['💻', '📊', '☕'],
    npcName: 'Nadia',
    npcRole: 'Project Lead',
    npcEmoji: '👩‍💻',
    turns: [
      {
        npcLine: 'Quick standup check: How is the client slide deck coming along before tomorrow’s deadline?',
        choices: [
          { text: 'I finished the summary slides this morning and I’ll loop you in once QA signs off by 3 PM.', natural: true, feedback: 'Great workplace vocabulary ("loop you in", clear ETA)!' },
          { text: 'Forgot.', natural: false, feedback: 'Share clear status and timeline at work.' },
        ],
      },
    ],
  },
  {
    id: 'hotel',
    name: 'Hotel',
    emoji: '🏨',
    sky: 'from-[#2E1659] via-[#472387] to-[#1B0D3B]',
    floor: 'bg-violet-950/80 border-violet-400/30',
    decorEmojis: ['🛎️', '🗝️', '🪴'],
    npcName: 'Sinta',
    npcRole: 'Front Desk',
    npcEmoji: '💁‍♀️',
    turns: [
      {
        npcLine: 'Good afternoon and welcome to Horizon Hotel! How may I assist you with your reservation?',
        choices: [
          { text: 'Hi! I have a reservation under Alex Pratama. Could we request a quiet room away from the elevator?', natural: true, feedback: 'Polite, clear hotel check-in request!' },
          { text: 'Room key now.', natural: false, feedback: 'Try "I have a reservation under..."' },
        ],
      },
    ],
  },
  {
    id: 'hospital',
    name: 'Hospital',
    emoji: '🏥',
    sky: 'from-[#0E3A47] via-[#13596B] to-[#09242E]',
    floor: 'bg-teal-950/80 border-teal-400/30',
    decorEmojis: ['🩺', '💊', '📋'],
    npcName: 'Nurse Dina',
    npcRole: 'Clinic Nurse',
    npcEmoji: '👩‍⚕️',
    turns: [
      {
        npcLine: 'Please take this vitamin twice daily after meals, and drink plenty of water.',
        choices: [
          { text: 'Just to confirm—one tablet after breakfast and one after dinner, right? Thank you!', natural: true, feedback: 'Confirming medical dosage keeps communication crystal clear!' },
          { text: 'Okay whatever.', natural: false, feedback: 'Always confirm medical instructions carefully.' },
        ],
      },
    ],
  },
  {
    id: 'transport',
    name: 'Public Transportation',
    emoji: '🚆',
    sky: 'from-[#10294F] via-[#1A427D] to-[#0B1A36]',
    floor: 'bg-slate-900/80 border-sky-400/30',
    decorEmojis: ['🚉', '🎫', '🕒'],
    npcName: 'Station Guide',
    npcRole: 'MRT Staff',
    npcEmoji: '🧑‍🔧',
    turns: [
      {
        npcLine: 'Next express train to Central Plaza arrives on Platform 2 in four minutes.',
        choices: [
          { text: 'Thank you! Should I transfer at South Hub or stay on Line B all the way?', natural: true, feedback: 'Smart transit question!' },
          { text: 'Train what?', natural: false, feedback: 'Ask "Which line goes to...?"' },
        ],
      },
    ],
  },
];

export function LifeSimulatorGame() {
  const { say } = useSpeak();
  const [state, setState] = useState<GameState>('MENU');
  const [scene, setScene] = useState<SceneSpec>(SCENES[0]);
  const [avatar, setAvatar] = useState<AvatarConfig | null>(null);
  const [completedScenes, setCompletedScenes] = useState<string[]>([]);
  const [playerX, setPlayerX] = useState(14);
  const [walking, setWalking] = useState(false);
  const [turnIdx, setTurnIdx] = useState(0);
  const [stars, setStars] = useState(3);
  const [history, setHistory] = useState<{ speaker: string; text: string; isPlayer?: boolean }[]>([]);
  const [feedback, setFeedback] = useState<{ text: string; good: boolean } | null>(null);
  const [score, setScore] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [result, setResult] = useState<GameResultSummary | null>(null);
  const [bgmOn, setBgmOn] = useState(true);

  useEffect(() => {
    void api.get<{ avatar: AvatarConfig; progress: { gameSlug: string; data?: { completedScenes?: string[] } }[] }>('/games/hub').then((r) => {
      setAvatar(r.avatar);
      const p = r.progress.find((g) => g.gameSlug === 'life-simulator');
      if (p?.data?.completedScenes) setCompletedScenes(p.data.completedScenes);
    });
    return () => gameAudio.stopMusic();
  }, []);

  const walk = (delta: number) => {
    gameAudio.step();
    setWalking(true);
    setPlayerX((x) => Math.max(0, Math.min(58, x + delta)));
    setTimeout(() => setWalking(false), 320);
  };

  const enterScene = async (sc: SceneSpec) => {
    setScene(sc);
    setState('LOADING');
    setPlayerX(22);
    setTurnIdx(0);
    setStars(3);
    setFeedback(null);
    setScore(0);
    setResult(null);
    setHistory([{ speaker: sc.npcName, text: sc.turns[0].npcLine }]);

    try {
      const res = await api.post<{ sessionId: string; questions: PublicQuestion[] }>('/games/sessions/start', {
        gameSlug: 'life-simulator',
        mode: sc.id,
      });
      setSessionId(res.sessionId);
      setState('PLAYING');
      if (bgmOn) gameAudio.startMusic('simulator');
      gameAudio.dialogue();
      say(sc.turns[0].npcLine);
    } catch (e) {
      toast.error((e as Error).message);
      setState('MENU');
    }
  };

  const pickChoice = async (choice: { text: string; natural: boolean; feedback: string }) => {
    setFeedback({ text: choice.feedback, good: choice.natural });
    if (!choice.natural) {
      gameAudio.wrong();
      setStars((s) => Math.max(1, s - 1));
      return;
    }

    gameAudio.correct();
    const nextScore = score + 150;
    setScore(nextScore);
    const updatedHistory = [...history, { speaker: 'You', text: choice.text, isPlayer: true }];

    if (turnIdx + 1 < scene.turns.length) {
      const nextTurn = turnIdx + 1;
      const npcReply = scene.turns[nextTurn].npcLine;
      setHistory([...updatedHistory, { speaker: scene.npcName, text: npcReply }]);
      setTurnIdx(nextTurn);
      setTimeout(() => {
        gameAudio.dialogue();
        say(npcReply);
      }, 300);
      return;
    }

    setHistory(updatedHistory);
    if (!sessionId) return;
    gameAudio.stopMusic();
    gameAudio.victory();
    setState('RESULTS');
    try {
      const res = await api.post<GameResultSummary>(`/games/sessions/${sessionId}/finish`, {
        score: nextScore + stars * 50,
        answers: [],
        meta: { scene: scene.id, stars, completed: true },
      });
      setResult(res);
      setCompletedScenes((prev) => [...new Set([...prev, scene.id])]);
      if (res.reward) celebrate(res.reward, `${scene.name} Cleared (${stars}★)!`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const toggleBgm = () => {
    if (bgmOn) {
      gameAudio.stopMusic();
      setBgmOn(false);
    } else {
      gameAudio.startMusic('simulator');
      setBgmOn(true);
    }
  };

  const activeTurn = scene.turns[turnIdx];

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <GameHudBar
        title={`English Life Simulator — ${scene.emoji} ${scene.name}`}
        state={state}
        score={score}
        extra={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5 rounded-xl bg-white/10 px-2.5 py-1 text-xs font-extrabold text-game-sun">
              {Array.from({ length: 3 }).map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < stars ? 'fill-game-sun text-game-sun' : 'text-white/25'}`} />
              ))}
            </span>
            <span className="rounded-xl bg-white/10 px-3 py-1 text-xs font-extrabold text-game-sky">{completedScenes.length}/8 Scenes</span>
            {state === 'PLAYING' && (
              <button onClick={toggleBgm} className="rounded-xl bg-white/10 px-2.5 py-1 text-xs font-bold hover:bg-white/20" title="Toggle Lo-Fi BGM">
                <Music className={`inline h-3.5 w-3.5 ${bgmOn ? 'text-emerald-400' : 'text-white/40'}`} />
              </button>
            )}
          </div>
        }
      />

      {/* Interactive Stage */}
      <div className={`relative min-h-[490px] overflow-hidden rounded-4xl border border-white/20 bg-gradient-to-b ${scene.sky} p-4 sm:p-6 shadow-2xl`}>
        {state === 'PLAYING' && (
          <div className="grid gap-5 lg:grid-cols-12">
            {/* Left: Visual 2.5D Environment Room */}
            <div className="flex flex-col justify-between space-y-4 lg:col-span-7">
              <div className="relative flex h-64 flex-col justify-between overflow-hidden rounded-3xl border border-white/15 bg-black/25 p-4">
                {/* Location Header & Props */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs font-extrabold text-game-sky">
                    <MapPin className="h-3.5 w-3.5" /> {scene.name}
                  </span>
                  <div className="flex gap-3 text-xl opacity-85">
                    {scene.decorEmojis.map((d, i) => (
                      <span key={i} className="rounded-xl bg-white/10 px-2 py-1 backdrop-blur">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Live NPC Speech Bubble */}
                <div className="self-end max-w-[75%] rounded-2xl rounded-br-sm border border-game-sky/50 bg-[#0D1542]/95 px-3.5 py-2 text-xs font-semibold text-white shadow-lg">
                  “{activeTurn.npcLine}”
                </div>

                {/* Floor & Characters */}
                <div className={`relative -mx-4 -mb-4 flex items-end justify-between border-t px-6 pb-3 pt-2 ${scene.floor}`}>
                  <div className="transition-transform duration-300" style={{ transform: `translateX(${playerX * 2.2}px)` }}>
                    <AvatarRenderer avatar={avatar} size={105} pose={walking ? 'run' : 'idle'} />
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-game-sky bg-white/15 text-3xl shadow-glow">
                      {scene.npcEmoji}
                    </div>
                    <span className="mt-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-extrabold text-game-sky">
                      {scene.npcName} · {scene.npcRole}
                    </span>
                  </div>
                </div>
              </div>

              {/* Walk + Audio Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <button onClick={() => walk(-18)} className="btn-game bg-white/15 px-4 py-2 text-xs">
                    <ArrowLeft className="h-4 w-4" /> Step Left
                  </button>
                  <button onClick={() => walk(18)} className="btn-game bg-game-sky text-navy-950 px-4 py-2 text-xs">
                    Step Right <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    gameAudio.dialogue();
                    say(activeTurn.npcLine);
                  }}
                  className="btn-game bg-game-grape px-4 py-2 text-xs"
                >
                  <Volume2 className="h-4 w-4" /> Replay Voice
                </button>
              </div>

              {/* Conversation History Log */}
              <div className="max-h-36 space-y-1.5 overflow-y-auto rounded-2xl border border-white/10 bg-black/30 p-3 text-xs">
                <p className="font-extrabold uppercase tracking-wider text-white/50 text-[10px]">Conversation Log</p>
                {history.map((h, i) => (
                  <p key={i} className={h.isPlayer ? 'text-emerald-300' : 'text-white/90'}>
                    <strong>{h.speaker}:</strong> {h.text}
                  </p>
                ))}
              </div>
            </div>

            {/* Right: Response Choice Panel */}
            <div className="flex flex-col justify-between rounded-3xl border border-white/15 bg-[#0C1238]/90 p-5 lg:col-span-5">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-game-sun">
                  <MessageCircle className="h-4 w-4" /> Turn {turnIdx + 1} of {scene.turns.length} · Your Reply
                </div>
                <p className="text-xs text-white/75">Choose the polite, natural English response:</p>

                <div className="mt-4 space-y-2.5">
                  {activeTurn.choices.map((c, idx) => (
                    <button
                      key={idx}
                      onClick={() => void pickChoice(c)}
                      className="w-full rounded-2xl border border-white/15 bg-white/10 p-4 text-left text-sm font-bold text-white transition hover:border-game-sky hover:bg-game-sky/20"
                    >
                      {c.text}
                    </button>
                  ))}
                </div>
              </div>

              {feedback ? (
                <div className={`mt-4 rounded-2xl border p-3.5 text-xs font-bold ${feedback.good ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200' : 'border-amber-400/50 bg-amber-500/20 text-amber-200'}`}>
                  <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                  {feedback.text}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl bg-white/5 p-3 text-[11px] text-white/60">
                  💡 Tip: Listen carefully to {scene.npcName}’s question, then pick the complete, polite response to earn all 3 stars!
                </div>
              )}
            </div>
          </div>
        )}

        <GameOverlayModal
          state={state}
          title="English Life Simulator"
          subtitle="Pick any of 8 real-world locations, walk up to the NPC, hear spoken dialogue with cozy lo-fi music, and respond naturally in English!"
          result={result}
          onStart={() => void enterScene(scene)}
          onRestart={() => void enterScene(scene)}
          menuExtra={
            <div className="grid grid-cols-2 gap-2">
              {SCENES.map((s) => {
                const cleared = completedScenes.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      gameAudio.step();
                      setScene(s);
                    }}
                    className={`flex items-center justify-between rounded-2xl border p-2.5 text-left text-xs font-bold transition ${
                      scene.id === s.id ? 'border-game-sky bg-game-sky/20' : 'border-white/15 bg-white/10'
                    }`}
                  >
                    <span>
                      {s.emoji} {s.name}
                    </span>
                    {cleared && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          }
        />
      </div>
    </div>
  );
}
