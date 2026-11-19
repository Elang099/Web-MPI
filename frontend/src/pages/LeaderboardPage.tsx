import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Flame, Trophy } from 'lucide-react';
import { api } from '@/services/api';
import { ErrorState, PageHeader, PageLoader, Tabs } from '@/components/ui';
import { AvatarRenderer, type AvatarConfig } from '@/games/AvatarRenderer';

interface BoardEntry {
  rank: number;
  xp: number;
  level: number;
  streak: number;
  cefr: string | null;
  avatar: AvatarConfig | null;
  user: { id: string; username: string; displayName: string };
  isMe: boolean;
}

export function LeaderboardPage() {
  const [period, setPeriod] = useState<'weekly' | 'all'>('all');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => api.get<{ period: string; board: BoardEntry[] }>(`/community/leaderboard?period=${period}`),
  });

  if (isLoading) return <PageLoader />;
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Friendly Competition"
        title="Leaderboard"
        subtitle="See top learners this week and all-time. Privacy settings let you hide your profile anytime."
        actions={
          <Tabs
            value={period}
            onChange={setPeriod}
            tabs={[
              { value: 'all', label: 'All-Time XP' },
              { value: 'weekly', label: 'This Week' },
            ]}
          />
        }
      />

      <div className="panel overflow-hidden">
        {data.board.length === 0 ? (
          <div className="p-10 text-center text-muted">No leaderboard entries for this period yet—complete a lesson to take #1!</div>
        ) : (
          <div className="divide-y divide-line/60">
            {data.board.map((row) => (
              <div key={`${row.rank}-${row.user.id}`} className={`flex items-center justify-between gap-4 px-5 py-4 ${row.isMe ? 'bg-cyan/10' : ''}`}>
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl font-display font-bold ${
                      row.rank === 1 ? 'bg-warning text-navy-950' : row.rank === 2 ? 'bg-slate-300 text-navy-950' : row.rank === 3 ? 'bg-amber-700 text-white' : 'bg-surface-2 text-muted'
                    }`}
                  >
                    {row.rank <= 3 ? <Trophy className="h-4 w-4" /> : row.rank}
                  </div>
                  <AvatarRenderer avatar={row.avatar} size={46} />
                  <div className="min-w-0">
                    {row.user.username !== 'hidden' ? (
                      <Link to={`/u/${row.user.username}`} className="truncate font-bold hover:text-cyan">
                        {row.user.displayName} {row.isMe && <span className="text-xs text-cyan">(You)</span>}
                      </Link>
                    ) : (
                      <span className="font-bold text-muted">{row.user.displayName}</span>
                    )}
                    <p className="text-xs text-muted">
                      Lv.{row.level} {row.cefr ? `· CEFR ${row.cefr}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <span className="hidden items-center gap-1 text-xs font-bold text-orange-400 sm:flex">
                    <Flame className="h-3.5 w-3.5" /> {row.streak}d
                  </span>
                  <span className="font-display text-lg font-bold text-cyan">{row.xp.toLocaleString()} XP</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
