import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PublicQuestion, RewardSummary } from '@fec/shared';
import { ArrowUpCircle, Check, Edit3, Hammer, Music, Sparkles, Users, Zap } from 'lucide-react';
import { api } from '@/services/api';
import { celebrate, toast } from '@/stores/ui';
import { gameAudio } from '../core/audioManager';
import { GameHudBar, type GameResultSummary } from '../core/GameStateMachine';
import { GameQuestionPrompt } from '../core/GameQuestionPrompt';
import { AvatarRenderer, type AvatarConfig } from '../AvatarRenderer';
import { ErrorState, Modal, PageLoader } from '@/components/ui';

interface CityBuilding {
  id: string;
  type: string;
  x: number;
  y: number;
  level: number;
}

interface CityData {
  name: string;
  bricks: number;
  wood: number;
  books: number;
  energy: number;
  population: number;
  buildings: CityBuilding[];
}

interface CatalogSpec {
  name: string;
  category: string;
  cost: { bricks: number; wood: number; books: number };
  pop: number;
  desc: string;
}

const BUILDING_EMOJI: Record<string, string> = {
  library: '📚',
  academy: '🏛️',
  cafe: '☕',
  tower: '📡',
  cottage: '🏡',
  park: '🌳',
  cinema: '🎬',
  studio: '🎙️',
};

const MISSION_TYPES = [
  { id: 'vocab-grammar', label: 'Vocabulary & Grammar Supply Run', rewardText: '+Bricks, Wood & Books' },
  { id: 'reading-writing', label: 'City Chronicle Reading & Writing Mission', rewardText: '+Extra Books & XP' },
];

export function CityBuilderGame() {
  const qc = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>('library');
  const [selectedBuilding, setSelectedBuilding] = useState<CityBuilding | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState('');

  // Educational Mission Modal
  const [missionOpen, setMissionOpen] = useState(false);
  const [missionSessionId, setMissionSessionId] = useState<string | null>(null);
  const [missionQs, setMissionQs] = useState<PublicQuestion[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; response: string | string[] }[]>([]);
  const [bgmOn, setBgmOn] = useState(false);

  useEffect(() => () => gameAudio.stopMusic(), []);

  const toggleBgm = () => {
    if (bgmOn) {
      gameAudio.stopMusic();
      setBgmOn(false);
    } else {
      gameAudio.startMusic('city');
      setBgmOn(true);
    }
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['city-state'],
    queryFn: () => api.get<{ city: CityData; catalog: Record<string, CatalogSpec> }>('/games/city'),
  });

  const { data: avatarRes } = useQuery({
    queryKey: ['avatar'],
    queryFn: () => api.get<{ avatar: AvatarConfig }>('/avatar'),
  });

  const buildMut = useMutation({
    mutationFn: ({ buildingType, x, y }: { buildingType: string; x: number; y: number }) =>
      api.post<{ city: CityData; reward: RewardSummary }>('/games/city/build', { buildingType, x, y }),
    onSuccess: (res) => {
      gameAudio.build();
      celebrate(res.reward, 'New Building Constructed!');
      void qc.invalidateQueries({ queryKey: ['city-state'] });
    },
    onError: (e) => {
      gameAudio.wrong();
      toast.error((e as Error).message);
    },
  });

  const upgradeMut = useMutation({
    mutationFn: (buildingId: string) => api.post<{ city: CityData; reward: RewardSummary }>('/games/city/upgrade', { buildingId }),
    onSuccess: (res) => {
      gameAudio.correct();
      setSelectedBuilding(null);
      celebrate(res.reward, 'Building Upgraded!');
      void qc.invalidateQueries({ queryKey: ['city-state'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const renameMut = useMutation({
    mutationFn: (name: string) => api.patch<{ city: CityData }>('/games/city/rename', { name }),
    onSuccess: () => {
      setRenaming(false);
      toast.success('City renamed!');
      void qc.invalidateQueries({ queryKey: ['city-state'] });
    },
  });

  const startMission = async (mode: string) => {
    gameAudio.dialogue();
    if (!bgmOn) {
      gameAudio.startMusic('city');
      setBgmOn(true);
    }
    try {
      const res = await api.post<{ sessionId: string; questions: PublicQuestion[] }>('/games/sessions/start', {
        gameSlug: 'city-builder',
        mode,
      });
      setMissionSessionId(res.sessionId);
      setMissionQs(res.questions.slice(0, 4));
      setQIdx(0);
      setAnswers([]);
      setMissionOpen(true);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const answerMissionQ = async (response: string | string[]) => {
    const q = missionQs[qIdx];
    const nextAnswers = [...answers, { questionId: q.id, response }];
    setAnswers(nextAnswers);

    if (qIdx + 1 < missionQs.length) {
      setQIdx(qIdx + 1);
      return;
    }

    // Finish mission on server to earn Bricks, Wood, Books, Energy!
    setMissionOpen(false);
    try {
      const res = await api.post<GameResultSummary>(`/games/sessions/${missionSessionId}/finish`, {
        score: nextAnswers.length * 120,
        answers: nextAnswers,
      });
      gameAudio.correct();
      if (res.reward) celebrate(res.reward, 'City Supplies Earned!');
      if (res.resourcesEarned) {
        toast.success(`+${res.resourcesEarned.bricks} Bricks, +${res.resourcesEarned.wood} Wood, +${res.resourcesEarned.books} Books!`);
      }
      void qc.invalidateQueries({ queryKey: ['city-state'] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (isLoading) return <PageLoader />;
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const { city, catalog } = data;
  const buildings = Array.isArray(city.buildings) ? city.buildings : [];
  const byCoord = new Map(buildings.map((b) => [`${b.x},${b.y}`, b]));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <GameHudBar
        title={city.name}
        state="PLAYING"
        score={city.population * 10}
        extra={
          <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold">
            <span className="rounded-xl bg-white/10 px-2.5 py-1 text-orange-300">🧱 {city.bricks}</span>
            <span className="rounded-xl bg-white/10 px-2.5 py-1 text-amber-300">🪵 {city.wood}</span>
            <span className="rounded-xl bg-white/10 px-2.5 py-1 text-game-sky">📚 {city.books}</span>
            <span className="rounded-xl bg-white/10 px-2.5 py-1 text-emerald-300">
              <Users className="mr-1 inline h-3.5 w-3.5" />
              {city.population}
            </span>
            <button onClick={toggleBgm} className="rounded-xl bg-white/10 px-2.5 py-1 hover:bg-white/20" title="Toggle City Builder Music">
              <Music className={`inline h-3.5 w-3.5 ${bgmOn ? 'text-emerald-400' : 'text-white/45'}`} />
            </button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Interactive 8x8 City Map */}
        <section className="rounded-4xl border border-white/15 bg-gradient-to-b from-[#173A4A] via-[#1B5141] to-[#13382D] p-4 sm:p-6 shadow-2xl lg:col-span-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {renaming ? (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newName.trim().length >= 2) renameMut.mutate(newName.trim());
                  }}
                >
                  <input className="input py-1 text-sm text-white" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="City name..." />
                  <button type="submit" className="rounded-xl bg-emerald-500 px-3 py-1 text-xs font-bold">
                    <Check className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <>
                  <h2 className="font-game text-xl font-black">{city.name}</h2>
                  <button
                    onClick={() => {
                      setNewName(city.name);
                      setRenaming(true);
                    }}
                    className="rounded-lg bg-white/10 p-1.5 text-white/75 hover:text-white"
                    aria-label="Rename city"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
            <span className="text-xs font-bold text-emerald-200">Tap an empty green tile to build · Tap a building to upgrade!</span>
          </div>

          <div className="grid grid-cols-8 gap-1.5 rounded-3xl border-2 border-emerald-300/20 bg-emerald-950/40 p-2 sm:gap-2 sm:p-3">
            {Array.from({ length: 64 }).map((_, idx) => {
              const x = idx % 8;
              const y = Math.floor(idx / 8);
              const b = byCoord.get(`${x},${y}`);
              const isRoad = x === 3 || y === 4;
              return (
                <button
                  key={`${x}-${y}`}
                  onClick={() => {
                    if (b) setSelectedBuilding(b);
                    else buildMut.mutate({ buildingType: selectedType, x, y });
                  }}
                  className={`relative aspect-square rounded-xl border transition hover:scale-105 ${
                    b
                      ? 'border-game-sun/60 bg-gradient-to-br from-[#23327A] to-[#141E52] shadow-md'
                      : isRoad
                        ? 'border-white/10 bg-slate-700/60 hover:border-game-sky'
                        : 'border-emerald-400/20 bg-emerald-600/35 hover:border-white/70 hover:bg-emerald-500/45'
                  }`}
                  title={b ? `${catalog[b.type]?.name} (Lv.${b.level})` : `Build ${catalog[selectedType]?.name}`}
                >
                  {b ? (
                    <div className="flex h-full flex-col items-center justify-center">
                      <span className="text-lg sm:text-2xl leading-none">{BUILDING_EMOJI[b.type] ?? '🏢'}</span>
                      <span className="mt-0.5 rounded bg-black/45 px-1 text-[9px] font-extrabold text-game-sun">Lv.{b.level}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-white/25">+</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Sidebar: Mayor Avatar + Earn Materials + Building Blueprints */}
        <aside className="space-y-4 lg:col-span-4">
          {avatarRes?.avatar && (
            <div className="flex items-center gap-3 rounded-3xl border border-white/15 bg-[#121A4C]/90 px-4 py-3">
              <AvatarRenderer avatar={avatarRes.avatar} size={64} pose="idle" />
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-game-sky">City Mayor</p>
                <p className="font-game text-base font-black">{avatarRes.avatar.name ?? 'Mayor'}</p>
                <p className="text-xs text-white/70">Population: {city.population}</p>
              </div>
            </div>
          )}

          <div className="rounded-4xl border border-game-sky/40 bg-gradient-to-br from-[#17256E] to-[#11184B] p-5 shadow-xl">
            <h3 className="flex items-center gap-2 font-game text-lg font-black text-game-sky">
              <Sparkles className="h-5 w-5" /> Earn Building Materials
            </h3>
            <p className="mt-1 text-xs text-white/75">Complete quick English challenges to earn Bricks, Wood, and Books for construction!</p>
            <div className="mt-3 space-y-2">
              {MISSION_TYPES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => void startMission(m.id)}
                  className="btn-game w-full justify-between bg-gradient-to-r from-game-grape to-game-candy px-4 py-2.5 text-left text-xs"
                >
                  <span>{m.label}</span>
                  <Zap className="h-4 w-4 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-4xl border border-white/15 bg-[#121A4C]/90 p-5">
            <h3 className="mb-3 flex items-center gap-2 font-game text-lg font-black">
              <Hammer className="h-5 w-5 text-game-sun" /> Blueprints
            </h3>
            <div className="grid max-h-[380px] gap-2 overflow-y-auto pr-1">
              {Object.entries(catalog).map(([key, spec]) => {
                const active = selectedType === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedType(key)}
                    className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition ${
                      active ? 'border-game-sun bg-game-sun/15' : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-2xl">{BUILDING_EMOJI[key] ?? '🏗️'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-extrabold">{spec.name}</span>
                        <span className="text-[11px] font-bold text-emerald-300">+{spec.pop} pop</span>
                      </div>
                      <p className="text-[11px] text-white/70">{spec.desc}</p>
                      <p className="mt-1 text-[11px] font-bold text-game-sun">
                        🧱 {spec.cost.bricks} · 🪵 {spec.cost.wood} · 📚 {spec.cost.books}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Building Upgrade Modal */}
      <Modal open={!!selectedBuilding} onClose={() => setSelectedBuilding(null)} title={selectedBuilding ? catalog[selectedBuilding.type]?.name : ''}>
        {selectedBuilding && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{BUILDING_EMOJI[selectedBuilding.type]}</span>
              <div>
                <p className="font-bold">Current Level: {selectedBuilding.level} / 5</p>
                <p className="text-sm text-muted">{catalog[selectedBuilding.type]?.desc}</p>
              </div>
            </div>
            {selectedBuilding.level < 5 ? (
              <button
                disabled={upgradeMut.isPending}
                onClick={() => upgradeMut.mutate(selectedBuilding.id)}
                className="btn-game w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-sm"
              >
                <ArrowUpCircle className="h-4 w-4" /> Upgrade to Lv.{selectedBuilding.level + 1}
              </button>
            ) : (
              <p className="rounded-2xl bg-success/15 p-3 text-center text-sm font-bold text-success">Maximum Level Reached! ✨</p>
            )}
          </div>
        )}
      </Modal>

      {/* City Educational Mission Modal */}
      <Modal open={missionOpen} onClose={() => setMissionOpen(false)} title="City Supply English Mission" className="!bg-[#121A4E] !text-white !border-white/20">
        {missionQs[qIdx] && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-game-sky">
              <span>
                Challenge {qIdx + 1} of {missionQs.length}
              </span>
              <span>{missionQs[qIdx].skill}</span>
            </div>
            <GameQuestionPrompt key={missionQs[qIdx].id} question={missionQs[qIdx]} submitLabel="Submit Answer" onSubmit={(r) => void answerMissionQ(r)} />
          </div>
        )}
      </Modal>
    </div>
  );
}
