import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RewardSummary } from '@fec/shared';
import { Flag, Send, Trash2, Trophy } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/stores/auth';
import { celebrate, toast } from '@/stores/ui';
import { ErrorState, PageHeader, PageLoader } from '@/components/ui';
import { Button } from '@/components/ui/Button';

interface ChallengeDto {
  id: string;
  title: string;
  description: string;
  period: string;
  target: number;
  xpReward: number;
  participants: number;
  entry: { progress: number; completedAt: string | null } | null;
}

interface PostDto {
  id: string;
  type: string;
  content: string;
  createdAt: string;
  user: { username: string; displayName: string; level: number; cefr: string | null };
  isMine: boolean;
  reactions: Record<string, number>;
  myReactions: string[];
}

export function CommunityPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [content, setContent] = useState('');

  const { data: chalData, isLoading: cLoad, error: cErr, refetch } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => api.get<{ challenges: ChallengeDto[] }>('/community/challenges'),
  });

  const { data: postData } = useQuery({
    queryKey: ['community-posts'],
    queryFn: () => api.get<{ posts: PostDto[] }>('/community/posts'),
  });

  const joinMut = useMutation({
    mutationFn: (id: string) => api.post(`/community/challenges/${id}/join`),
    onSuccess: () => {
      toast.success('Joined challenge!');
      void qc.invalidateQueries({ queryKey: ['challenges'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const postMut = useMutation({
    mutationFn: (text: string) => api.post<{ reward: RewardSummary }>('/community/posts', { content: text, type: 'TEXT' }),
    onSuccess: (res) => {
      setContent('');
      celebrate(res.reward, 'Shared with Community!');
      void qc.invalidateQueries({ queryKey: ['community-posts'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const reactMut = useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string }) => api.post(`/community/posts/${id}/react`, { emoji }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['community-posts'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/community/posts/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['community-posts'] }),
  });

  const reportPost = async (id: string) => {
    const reason = window.prompt('Why are you reporting this post?');
    if (!reason || reason.trim().length < 3) return;
    await api.post(`/community/posts/${id}/report`, { reason });
    toast.info('Report submitted for moderator review.');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    postMut.mutate(content);
  };

  if (cLoad) return <PageLoader />;
  if (cErr) return <ErrorState error={cErr} onRetry={() => void refetch()} />;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Community & Challenges"
        title="Learn & Grow Together"
        subtitle="Join friendly weekly English challenges, share study milestones, and cheer on fellow learners."
      />

      {/* Community Challenges */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
          <Trophy className="h-5 w-5 text-warning" /> Active Challenges
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {chalData?.challenges.map((c) => (
            <div key={c.id} className="panel flex flex-col justify-between p-6">
              <div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="chip text-cyan">{c.period}</span>
                  <span className="text-muted">{c.participants} joined</span>
                </div>
                <h3 className="mt-3 text-lg font-bold">{c.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{c.description}</p>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-4">
                <span className="text-xs font-bold text-warning">+{c.xpReward} XP</span>
                {c.entry ? (
                  <span className="chip border-success/40 bg-success/10 text-success">Joined ✓</span>
                ) : (
                  <Button size="sm" disabled={!user} onClick={() => joinMut.mutate(c.id)}>
                    Join Challenge
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Community Milestone Feed */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-4">
          {user && (
            <form onSubmit={handleSubmit} className="panel p-5">
              <textarea
                rows={3}
                className="input text-sm"
                placeholder="Share a learning tip, English sentence you mastered, or game milestone..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="mt-3 flex justify-end">
                <Button type="submit" size="sm" loading={postMut.isPending} icon={<Send className="h-3.5 w-3.5" />}>
                  Share Update
                </Button>
              </div>
            </form>
          )}

          {postData?.posts.map((p) => (
            <article key={p.id} className="panel p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  {p.user.username !== 'hidden' ? (
                    <Link to={`/u/${p.user.username}`} className="font-bold hover:text-cyan">
                      {p.user.displayName}
                    </Link>
                  ) : (
                    <span className="font-bold text-muted">{p.user.displayName}</span>
                  )}
                  <span className="ml-2 text-xs text-muted">
                    Lv.{p.user.level} {p.user.cefr ? `· ${p.user.cefr}` : ''} · {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {p.type === 'MILESTONE' && <span className="chip text-cyan">Milestone</span>}
                  {p.isMine && (
                    <button aria-label="Delete post" onClick={() => deleteMut.mutate(p.id)} className="text-muted hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  {!p.isMine && user && (
                    <button aria-label="Report post" onClick={() => void reportPost(p.id)} className="text-muted hover:text-warning">
                      <Flag className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed">{p.content}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['👏', '🔥', '🚀', '💡'].map((emoji) => {
                  const active = p.myReactions.includes(emoji);
                  return (
                    <button
                      key={emoji}
                      disabled={!user}
                      onClick={() => reactMut.mutate({ id: p.id, emoji })}
                      className={`rounded-xl border px-2.5 py-1 text-xs font-bold transition ${
                        active ? 'border-cyan bg-cyan/15 text-cyan' : 'border-line bg-surface-2/60 text-muted hover:text-ink'
                      }`}
                    >
                      {emoji} {p.reactions[emoji] ?? 0}
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>

        <aside className="panel h-fit p-6 lg:col-span-4">
          <h3 className="font-bold">Community Guidelines</h3>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted">
            <li>• Practice writing positive posts and sentences in English.</li>
            <li>• Support peers celebrating milestones and high streaks.</li>
            <li>• Keep personal details private—never share phone numbers or passwords.</li>
            <li>• Flag inappropriate posts anytime; admins/teachers review every report.</li>
          </ul>
          <Link to="/leaderboard" className="mt-5 inline-block text-xs font-bold text-cyan hover:underline">
            View XP Leaderboard →
          </Link>
        </aside>
      </section>
    </div>
  );
}
