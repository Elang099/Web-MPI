import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AUDIENCES, CATEGORIES, CATEGORY_META, LEVELS, type Category } from '@fec/shared';
import { BookOpen, CheckCircle2, Clock, Search } from 'lucide-react';
import { api } from '@/services/api';
import { Badge, EmptyState, ErrorState, PageHeader, PageLoader } from '@/components/ui';

interface TopicWithLessons {
  id: string;
  slug: string;
  category: Category;
  title: string;
  description: string;
  lessons: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    level: string;
    audiences: string[];
    durationMin: number;
    xpReward: number;
    emoji?: string;
    progress: { status: string; bestScore: number };
  }[];
}

export function LearnPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const category = params.get('category') ?? '';
  const level = params.get('level') ?? '';
  const audience = params.get('audience') ?? '';

  const updateParam = (key: string, val: string) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val);
    else next.delete(key);
    setParams(next);
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['topics', category, level, audience, q],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (category) qs.set('category', category);
      if (level) qs.set('level', level);
      if (audience) qs.set('audience', audience);
      if (q) qs.set('q', q);
      return api.get<{ topics: TopicWithLessons[] }>(`/learning/topics?${qs.toString()}`);
    },
  });

  return (
    <div>
      <PageHeader
        eyebrow="English Learning Center"
        title="Master Every Pillar of English"
        subtitle="Structured, visual lessons across Grammar, Vocabulary, Reading, Writing, Listening, Speaking, Pronunciation, Text Types & Vocational English."
      />

      {/* Category Pills */}
      <div className="scrollbar-none mb-5 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => updateParam('category', '')}
          className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-bold transition ${
            !category ? 'bg-brand-gradient text-white shadow-glow' : 'border border-line bg-surface text-muted hover:text-ink'
          }`}
        >
          All 9 Categories
        </button>
        {CATEGORIES.map((c) => {
          const meta = CATEGORY_META[c];
          const active = category === c;
          return (
            <button
              key={c}
              onClick={() => updateParam('category', active ? '' : c)}
              className={`whitespace-nowrap rounded-2xl border px-4 py-2 text-sm font-bold transition ${
                active ? 'border-cyan bg-cyan/15 text-cyan' : 'border-line bg-surface text-muted hover:text-ink'
              }`}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="panel mb-8 grid gap-3 p-4 sm:grid-cols-12">
        <div className="relative sm:col-span-6">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            className="input pl-10 py-2.5 text-sm"
            placeholder="Search grammar, vocabulary, text types, interviews..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className="input py-2.5 text-sm sm:col-span-3" value={level} onChange={(e) => updateParam('level', e.target.value)}>
          <option value="">All Levels (Beginner–Advanced)</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select className="input py-2.5 text-sm sm:col-span-3" value={audience} onChange={(e) => updateParam('audience', e.target.value)}>
          <option value="">All Learners (SMP · SMA · SMK · General)</option>
          {AUDIENCES.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !data?.topics.length ? (
        <EmptyState icon={<BookOpen className="h-6 w-6" />} title="No lessons match these filters" body="Try clearing your search or selecting another level." />
      ) : (
        <div className="space-y-10">
          {data.topics.map((topic) => {
            const meta = CATEGORY_META[topic.category];
            return (
              <section key={topic.id}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Badge color={meta.color}>{meta.label}</Badge>
                    <h2 className="mt-1.5 text-2xl font-bold">{topic.title}</h2>
                    <p className="text-sm text-muted">{topic.description}</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {topic.lessons.map((lesson) => {
                    const done = lesson.progress.status === 'COMPLETED';
                    return (
                      <Link key={lesson.id} to={`/learn/lesson/${lesson.slug}`} className="panel panel-hover flex flex-col justify-between p-5">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-2xl">{lesson.emoji ?? '📘'}</span>
                            {done ? (
                              <span className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Done
                              </span>
                            ) : (
                              <span className="chip">{lesson.level}</span>
                            )}
                          </div>
                          <h3 className="mt-3 text-lg font-bold">{lesson.title}</h3>
                          <p className="mt-1.5 text-sm text-muted">{lesson.summary}</p>
                        </div>

                        <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-3 text-xs font-semibold">
                          <span className="flex items-center gap-1 text-muted">
                            <Clock className="h-3.5 w-3.5" /> {lesson.durationMin} min · {lesson.audiences.join(' · ')}
                          </span>
                          <span className="text-cyan">+{lesson.xpReward} XP</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
