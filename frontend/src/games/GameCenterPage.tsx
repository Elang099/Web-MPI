import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as THREE from 'three';
import { GAME_META, GAME_SLUGS, type GameSlug, type RewardSummary } from '@fec/shared';
import { Building2, CheckCircle2, Compass, Gamepad2, MessageSquare, Play, Puzzle, Shirt, Sparkles, Trophy, Zap } from 'lucide-react';
import { api } from '@/services/api';
import { celebrate, toast } from '@/stores/ui';
import { AvatarRenderer, type AvatarConfig } from './AvatarRenderer';
import { ErrorState, PageLoader } from '@/components/ui';
import { ProgressBar } from '@/components/ui/Progress';

interface HubPayload {
  progress: { gameSlug: string; highScore: number; bestDistance: number; totalPlays: number; totalCorrect: number; level: number }[];
  avatar: AvatarConfig;
  city: { name: string; population: number; bricks: number; wood: number; books: number };
  missions: { id: string; title: string; description: string; progress: number; target: number; completed: boolean; claimed: boolean; xpReward: number; coinReward: number }[];
}

const GAME_VISUALS: Record<GameSlug, { gradient: string; badge: string; icon: typeof Gamepad2; modeHint: string }> = {
  'english-dash': { gradient: 'from-[#FF4D8D] to-[#7C5CFF]', badge: '3-Lane Endless Runner', icon: Zap, modeHint: 'Subway Runner + Word Gates' },
  'english-adventure': { gradient: 'from-[#22C55E] to-[#0EA5E9]', badge: 'Exploration Platformer', icon: Compass, modeHint: '4 Unlockable Worlds & Clues' },
  'city-builder': { gradient: 'from-[#F59E0B] to-[#F97316]', badge: 'City Simulation', icon: Building2, modeHint: 'Build City via English Missions' },
  'word-puzzle': { gradient: 'from-[#7C5CFF] to-[#EC4899]', badge: '7 Puzzle Modes', icon: Puzzle, modeHint: 'Scramble, Search, Memory, Idioms' },
  'life-simulator': { gradient: 'from-[#00D1FF] to-[#6366F1]', badge: '8 Real-Life Scenes', icon: MessageSquare, modeHint: 'NPC Conversations & Listening' },
};

/** Small Three.js 3D-inspired crystal trophy showcase for the Game Center Hero */
function ThreeArcadeShowcase() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.z = 3.8;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(160, 160);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      el.appendChild(renderer.domElement);

      const geo = new THREE.IcosahedronGeometry(1.05, 0);
      const mat = new THREE.MeshStandardMaterial({ color: 0x00d1ff, emissive: 0x4c1d95, roughness: 0.2, metalness: 0.75, wireframe: false });
      const gem = new THREE.Mesh(geo, mat);
      scene.add(gem);

      const ringGeo = new THREE.TorusGeometry(1.45, 0.05, 12, 48);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd23f });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = 1.1;
      scene.add(ring);

      const l1 = new THREE.DirectionalLight(0xffffff, 2);
      l1.position.set(2, 3, 4);
      scene.add(l1, new THREE.AmbientLight(0x93c5fd, 1.2));

      let raf = 0;
      const animate = () => {
        gem.rotation.y += 0.015;
        gem.rotation.x += 0.008;
        ring.rotation.z -= 0.018;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
      animate();

      return () => {
        cancelAnimationFrame(raf);
        renderer.dispose();
        if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
      };
    } catch {
      return undefined;
    }
  }, []);

  return <div ref={mountRef} className="h-40 w-40 shrink-0" aria-hidden />;
}

export function GameCenterPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['game-hub'],
    queryFn: () => api.get<HubPayload>('/games/hub'),
  });

  const claimMut = useMutation({
    mutationFn: (id: string) => api.post<{ reward: RewardSummary }>(`/progress/missions/${id}/claim`),
    onSuccess: (res) => celebrate(res.reward, 'Mission Reward Claimed!'),
    onError: (e) => toast.error((e as Error).message),
  });

  if (isLoading) return <PageLoader />;
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="space-y-8">
      {/* Arcade Hero + Avatar Corner */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="relative overflow-hidden rounded-4xl border border-white/15 bg-gradient-to-br from-[#19236A] via-[#2F1A78] to-[#12194F] p-6 sm:p-8 shadow-2xl lg:col-span-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-game-sun/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-game-sun">
                <Sparkles className="h-3.5 w-3.5" /> Immersive Arcade World
              </span>
              <h1 className="mt-3 font-game text-3xl font-black sm:text-4xl">Learn English Inside Every Game!</h1>
              <p className="mt-2 max-w-xl font-sans text-sm text-white/80">
                Dodge obstacles, choose correct word gates, unlock adventure doors, build your city, and talk with NPCs. Every correct challenge powers
                your XP, Coins, and City!
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/games/english-dash" className="btn-game bg-gradient-to-r from-game-candy to-game-grape text-sm">
                  <Play className="h-4 w-4 fill-current" /> Quick Play: English Dash
                </Link>
                <Link to="/games/city-builder" className="btn-game bg-white/15 text-sm">
                  🏙️ {data.city.name} (Pop. {data.city.population})
                </Link>
              </div>
            </div>
            <ThreeArcadeShowcase />
          </div>
        </div>

        {/* Player Avatar Spotlight */}
        <div className="flex flex-col items-center justify-between rounded-4xl border border-white/15 bg-[#121A4C]/90 p-6 text-center shadow-2xl lg:col-span-4">
          <div className="w-full flex items-center justify-between text-xs font-bold text-game-sky">
            <span>MY AVATAR</span>
            <span>{data.avatar.name ?? 'Runner'}</span>
          </div>
          <AvatarRenderer avatar={data.avatar} size={150} pose="idle" />
          <Link to="/games/avatar" className="btn-game mt-2 w-full bg-gradient-to-r from-game-sky to-blue-600 text-sm">
            <Shirt className="h-4 w-4" /> Customize & Shop
          </Link>
        </div>
      </section>

      {/* 5 Educational Games Grid */}
      <section>
        <h2 className="mb-4 font-game text-2xl font-black">Choose Your Game</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {GAME_SLUGS.map((slug) => {
            const meta = GAME_META[slug];
            const vis = GAME_VISUALS[slug];
            const prog = data.progress.find((p) => p.gameSlug === slug);
            const Icon = vis.icon;
            return (
              <Link
                key={slug}
                to={`/games/${slug}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-4xl border border-white/15 bg-[#131C52]/90 p-6 transition duration-300 hover:-translate-y-1 hover:border-white/40 hover:shadow-2xl"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${vis.gradient} shadow-game`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold text-game-sky">{vis.badge}</span>
                  </div>
                  <h3 className="mt-4 font-game text-2xl font-black">{meta.title}</h3>
                  <p className="mt-1 font-sans text-sm text-white/75">{meta.tagline}</p>
                  <p className="mt-2 text-xs font-bold text-game-sun">{vis.modeHint}</p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-bold">
                  <div className="text-white/75">
                    {prog ? (
                      <>
                        Best: <span className="text-game-sun">{prog.highScore.toLocaleString()}</span> · {prog.totalPlays} plays
                      </>
                    ) : (
                      'Not played yet — Try now!'
                    )}
                  </div>
                  <span className="rounded-xl bg-white/15 px-3 py-1.5 text-white group-hover:bg-white group-hover:text-navy-950 transition">
                    Play →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Game Center Missions */}
      <section className="rounded-4xl border border-white/15 bg-[#121A4C]/90 p-6">
        <h2 className="mb-4 flex items-center gap-2 font-game text-xl font-black">
          <Trophy className="h-5 w-5 text-game-sun" /> Arcade Missions & Rewards
        </h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data.missions.map((m) => (
            <div key={m.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{m.title}</p>
                  <p className="text-xs text-white/70">
                    {m.progress}/{m.target} · +{m.xpReward} XP · +{m.coinReward} Coins
                  </p>
                </div>
                {m.claimed ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> Claimed
                  </span>
                ) : m.completed ? (
                  <button onClick={() => claimMut.mutate(m.id)} className="rounded-xl bg-emerald-500 px-3 py-1 text-xs font-extrabold text-white">
                    Claim
                  </button>
                ) : null}
              </div>
              <ProgressBar value={(m.progress / Math.max(1, m.target)) * 100} color="#FFD23F" height={6} className="mt-3" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
