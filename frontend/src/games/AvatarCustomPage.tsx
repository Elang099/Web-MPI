import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { COSMETIC_TYPES, type CosmeticType } from '@fec/shared';
import { ArrowLeft, Check, Coins, Eye, Lock, RotateCcw, ShoppingBag, Sparkles } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/stores/ui';
import { useAuth } from '@/stores/auth';
import { AvatarRenderer, type AvatarConfig } from './AvatarRenderer';
import { ErrorState, PageLoader } from '@/components/ui';

interface CosmeticItem {
  id: string;
  slug: string;
  name: string;
  type: CosmeticType;
  rarity: string;
  priceCoins: number;
  unlockLevel: number;
  achievementSlug?: string | null;
  owned: boolean;
}

const SKIN_TONES = ['#FDE2C8', '#F1C27D', '#D99B66', '#A5694F', '#6B4226'];
const HAIR_COLORS = ['#1E293B', '#2B1B12', '#7C2D12', '#F59E0B', '#00D1FF', '#A855F7', '#EC4899'];
const EXPRESSIONS = ['happy', 'wink', 'determined', 'surprised'] as const;

export function AvatarCustomPage() {
  const qc = useQueryClient();
  const patchStats = useAuth((s) => s.patchStats);
  const [activeType, setActiveType] = useState<CosmeticType>('OUTFIT');
  const [pose, setPose] = useState<'idle' | 'run' | 'jump' | 'celebrate'>('idle');
  const [previewItem, setPreviewItem] = useState<CosmeticItem | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['avatar'],
    queryFn: () => api.get<{ avatar: AvatarConfig; coins: number; level: number; items: CosmeticItem[] }>('/avatar'),
  });

  const equipMut = useMutation({
    mutationFn: (patch: Partial<AvatarConfig>) => api.patch<{ avatar: AvatarConfig }>('/avatar', patch),
    onSuccess: () => {
      toast.success('Avatar updated!');
      void qc.invalidateQueries({ queryKey: ['avatar'] });
      void qc.invalidateQueries({ queryKey: ['game-hub'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const buyMut = useMutation({
    mutationFn: (itemSlug: string) => api.post<{ ok: boolean; coins: number; item: CosmeticItem }>('/avatar/purchase', { itemSlug }),
    onSuccess: (res) => {
      toast.success(`Unlocked ${res.item.name}!`);
      patchStats({ coins: res.coins });
      void qc.invalidateQueries({ queryKey: ['avatar'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (isLoading) return <PageLoader />;
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const { avatar, coins, level, items } = data;
  const filteredItems = items.filter((i) => i.type === activeType);

  const fieldMap: Record<CosmeticType, keyof AvatarConfig> = {
    HAIR: 'hairStyle',
    OUTFIT: 'outfit',
    ACCESSORY: 'accessory',
    SHOES: 'shoes',
    EFFECT: 'effect',
    SKIN: 'skinTone',
  };

  // Live preview merges the equipped avatar with any cosmetic item being previewed before purchase
  const displayAvatar: AvatarConfig = previewItem
    ? { ...avatar, [fieldMap[previewItem.type]]: previewItem.slug }
    : avatar;

  const equipField = (item: CosmeticItem) => {
    const key = fieldMap[item.type];
    const currentlyEquipped = avatar[key] === item.slug;
    const value = currentlyEquipped && (key === 'accessory' || key === 'effect') ? null : item.slug;
    setPreviewItem(null);
    equipMut.mutate({ [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/games" className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20">
          <ArrowLeft className="h-4 w-4" /> Back to Game Center
        </Link>
        <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2 text-sm font-extrabold">
          <Coins className="h-4 w-4 text-game-sun" />
          <span className="text-game-sun">{coins} Coins</span>
          <span className="text-white/30">|</span>
          <span className="text-game-sky">Level {level}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Live Preview Stage */}
        <section className="flex flex-col items-center justify-between rounded-4xl border border-white/15 bg-gradient-to-b from-[#1A2468] to-[#0D133B] p-6 text-center lg:col-span-5">
          <div className="w-full flex items-center justify-between text-xs font-bold text-game-sky">
            <span>{previewItem ? 'TRYING ON PREVIEW' : 'LIVE PREVIEW'}</span>
            <span>{avatar.name ?? 'Runner'}</span>
          </div>

          <div className="my-4">
            <AvatarRenderer avatar={displayAvatar} size={220} pose={pose} />
          </div>

          {previewItem && (
            <div className="mb-4 flex w-full items-center justify-between gap-2 rounded-2xl border border-game-sun/50 bg-game-sun/15 px-3.5 py-2 text-xs font-bold text-game-sun">
              <span>Previewing: {previewItem.name}</span>
              <button onClick={() => setPreviewItem(null)} className="inline-flex items-center gap-1 rounded-lg bg-black/30 px-2 py-1 text-white hover:bg-black/50">
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-1.5">
            {(['idle', 'run', 'jump', 'celebrate'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPose(p)}
                className={`rounded-xl px-3 py-1.5 text-xs font-extrabold capitalize ${
                  pose === p ? 'bg-game-sky text-navy-950' : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Skin Tone, Hair Color & Expression */}
          <div className="mt-6 w-full space-y-4 border-t border-white/10 pt-4 text-left text-xs font-bold">
            <div>
              <span className="text-white/70">Skin Tone</span>
              <div className="mt-2 flex gap-2">
                {SKIN_TONES.map((c) => (
                  <button
                    key={c}
                    onClick={() => equipMut.mutate({ skinTone: c })}
                    className={`h-7 w-7 rounded-full border-2 ${avatar.skinTone === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ background: c }}
                    aria-label={`Skin tone ${c}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="text-white/70">Hair Color</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {HAIR_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => equipMut.mutate({ hairColor: c })}
                    className={`h-7 w-7 rounded-full border-2 ${avatar.hairColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ background: c }}
                    aria-label={`Hair color ${c}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="text-white/70">Expression</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {EXPRESSIONS.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => equipMut.mutate({ expression: ex })}
                    className={`rounded-xl px-3 py-1 capitalize ${
                      avatar.expression === ex ? 'bg-game-candy text-white' : 'bg-white/10 text-white/75'
                    }`}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Wardrobe & Coin Shop */}
        <section className="rounded-4xl border border-white/15 bg-[#121A4E]/90 p-6 lg:col-span-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h1 className="font-game text-2xl font-black">Wardrobe & Cosmetic Shop</h1>
            <span className="text-xs text-white/70">Cosmetics are 100% optional rewards for learning!</span>
          </div>

          <div className="scrollbar-none mb-5 flex gap-2 overflow-x-auto pb-1">
            {COSMETIC_TYPES.filter((t) => t !== 'SKIN').map((t) => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`whitespace-nowrap rounded-2xl px-4 py-2 text-xs font-extrabold ${
                  activeType === t ? 'bg-gradient-to-r from-game-candy to-game-grape text-white' : 'bg-white/10 text-white/75 hover:bg-white/20'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            {filteredItems.map((item) => {
              const equipped =
                avatar.hairStyle === item.slug ||
                avatar.outfit === item.slug ||
                avatar.accessory === item.slug ||
                avatar.shoes === item.slug ||
                avatar.effect === item.slug;
              const isPreviewing = previewItem?.slug === item.slug;

              return (
                <div
                  key={item.id}
                  onClick={() => !item.owned && setPreviewItem(isPreviewing ? null : item)}
                  className={`flex flex-col justify-between rounded-3xl border p-4 transition ${
                    !item.owned ? 'cursor-pointer hover:border-game-sun/60' : ''
                  } ${
                    isPreviewing
                      ? 'border-game-sun bg-game-sun/15'
                      : equipped
                        ? 'border-game-sky bg-game-sky/15'
                        : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-extrabold text-game-sun">{item.rarity}</span>
                      {equipped ? (
                        <span className="text-xs font-extrabold text-game-sky">Equipped ✓</span>
                      ) : isPreviewing ? (
                        <span className="text-xs font-extrabold text-game-sun">Previewing 👁️</span>
                      ) : null}
                    </div>
                    <h3 className="mt-2 font-game text-lg font-extrabold">{item.name}</h3>
                    {item.unlockLevel > 1 && <p className="text-xs text-white/65">Requires Level {item.unlockLevel}</p>}
                  </div>

                  <div className="mt-4 space-y-2" onClick={(e) => e.stopPropagation()}>
                    {!item.owned && (
                      <button
                        type="button"
                        onClick={() => setPreviewItem(isPreviewing ? null : item)}
                        className={`flex w-full items-center justify-center gap-1.5 rounded-2xl border py-1.5 text-xs font-bold transition ${
                          isPreviewing ? 'border-game-sun bg-game-sun/20 text-game-sun' : 'border-white/15 bg-white/5 text-white/80 hover:bg-white/15'
                        }`}
                      >
                        <Eye className="h-3.5 w-3.5" /> {isPreviewing ? 'Stop Preview' : 'Preview on Avatar'}
                      </button>
                    )}

                    {item.owned ? (
                      <button
                        onClick={() => equipField(item)}
                        className={`w-full rounded-2xl py-2 text-xs font-extrabold ${
                          equipped ? 'bg-white/20 text-white' : 'bg-game-sky text-navy-950 hover:brightness-110'
                        }`}
                      >
                        {equipped ? (item.type === 'ACCESSORY' || item.type === 'EFFECT' ? 'Unequip' : <><Check className="inline h-3.5 w-3.5" /> Wearing</>) : 'Equip'}
                      </button>
                    ) : item.achievementSlug ? (
                      <div className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-3 py-2 text-xs font-bold text-amber-300">
                        <Sparkles className="h-3.5 w-3.5" /> Unlock via Achievement
                      </div>
                    ) : level < item.unlockLevel ? (
                      <div className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-3 py-2 text-xs font-bold text-white/60">
                        <Lock className="h-3.5 w-3.5" /> Reach Level {item.unlockLevel}
                      </div>
                    ) : (
                      <button
                        disabled={buyMut.isPending || coins < item.priceCoins}
                        onClick={() => {
                          setPreviewItem(null);
                          buyMut.mutate(item.slug);
                        }}
                        className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-2 text-xs font-extrabold text-navy-950 disabled:opacity-45"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" /> Buy for {item.priceCoins} Coins
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
