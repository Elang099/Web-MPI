import { useQuery } from '@tanstack/react-query';
import { Award, CheckCircle2, Lock } from 'lucide-react';
import { api } from '@/services/api';
import { Badge, ErrorState, PageHeader, PageLoader } from '@/components/ui';
import { ProgressBar } from '@/components/ui/Progress';

interface AchievementRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  rarity: string;
  threshold: number;
  current: number;
  percent: number;
  xpReward: number;
  coinReward: number;
  itemRewardSlug?: string | null;
  earned: boolean;
  earnedAt: string | null;
}

const RARITY_COLOR: Record<string, string> = {
  COMMON: '#94A3B8',
  RARE: '#00D1FF',
  EPIC: '#A855F7',
  LEGENDARY: '#F59E0B',
};

export function AchievementsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => api.get<{ achievements: AchievementRow[] }>('/progress/achievements'),
  });

  if (isLoading) return <PageLoader />;
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const earned = data.achievements.filter((a) => a.earned).length;

  return (
    <div>
      <PageHeader
        eyebrow="Milestones & Badges"
        title="Achievements"
        subtitle={`Unlocked ${earned} of ${data.achievements.length} badges. Earn XP, coins, and exclusive avatar cosmetics!`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.achievements.map((a) => {
          const color = RARITY_COLOR[a.rarity] ?? '#00D1FF';
          return (
            <div key={a.id} className={`panel flex flex-col justify-between p-6 ${a.earned ? 'border-cyan/50 shadow-glow' : 'opacity-85'}`}>
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-2" style={{ color }}>
                    {a.earned ? <Award className="h-6 w-6" /> : <Lock className="h-5 w-5 text-muted" />}
                  </div>
                  <Badge color={color}>{a.rarity}</Badge>
                </div>
                <h2 className="mt-4 text-lg font-bold">{a.title}</h2>
                <p className="mt-1 text-sm text-muted">{a.description}</p>
                {a.itemRewardSlug && <p className="mt-2 text-xs font-bold text-warning">🎁 Unlocks avatar cosmetic!</p>}
              </div>

              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                  <span>
                    {a.current} / {a.threshold}
                  </span>
                  {a.earned ? (
                    <span className="flex items-center gap-1 text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Unlocked
                    </span>
                  ) : (
                    <span className="text-cyan">
                      +{a.xpReward} XP · +{a.coinReward} coins
                    </span>
                  )}
                </div>
                <ProgressBar value={a.percent} color={color} height={6} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
