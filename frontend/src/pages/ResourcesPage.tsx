import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Volume2 } from 'lucide-react';
import { api } from '@/services/api';
import { useSpeak } from '@/hooks/useSpeech';
import { PageHeader, Tabs } from '@/components/ui';

const IPA_SOUNDS = [
  { symbol: '/iː/', sample: 'sheep, read, team', tip: 'Long tense "ee" sound' },
  { symbol: '/ɪ/', sample: 'ship, sit, busy', tip: 'Short relaxed "i"' },
  { symbol: '/θ/', sample: 'think, three, bath', tip: 'Tongue gently between teeth, voiceless' },
  { symbol: '/ð/', sample: 'this, that, weather', tip: 'Tongue between teeth, voiced vibration' },
  { symbol: '/ʃ/', sample: 'she, nation, wash', tip: 'Soft "sh" airflow' },
  { symbol: '/tʃ/', sample: 'chair, teacher, watch', tip: 'Crisp "ch" stop + release' },
  { symbol: '/ə/', sample: 'about, teacher, problem', tip: 'Unstressed schwa — most common English vowel!' },
  { symbol: '/eɪ/', sample: 'say, train, explain', tip: 'Glide from /e/ toward /ɪ/' },
];

const IRREGULAR_VERBS = [
  ['be', 'was / were', 'been'],
  ['begin', 'began', 'begun'],
  ['break', 'broke', 'broken'],
  ['build', 'built', 'built'],
  ['choose', 'chose', 'chosen'],
  ['do', 'did', 'done'],
  ['eat', 'ate', 'eaten'],
  ['find', 'found', 'found'],
  ['give', 'gave', 'given'],
  ['go', 'went', 'gone'],
  ['know', 'knew', 'known'],
  ['make', 'made', 'made'],
  ['read', 'read /red/', 'read /red/'],
  ['speak', 'spoke', 'spoken'],
  ['take', 'took', 'taken'],
  ['teach', 'taught', 'taught'],
  ['think', 'thought', 'thought'],
  ['write', 'wrote', 'written'],
];

const TEXT_TYPES_GUIDE = [
  ['Descriptive', 'Describe a specific person, place or object', 'Identification → Description', 'Simple Present'],
  ['Narrative', 'Entertain & share a moral via conflict', 'Orientation → Complication → Resolution', 'Simple Past'],
  ['Recount', 'Retell real past events in sequence', 'Orientation → Events → Re-orientation', 'Simple Past'],
  ['Procedure', 'Show steps to make or operate something', 'Goal → Materials → Steps', 'Imperatives'],
  ['Report', 'Present general factual information', 'General Classification → Description', 'Simple Present'],
  ['Analytical Exposition', 'Argue why an idea/topic matters', 'Thesis → Arguments → Reiteration', 'Modals & Connectors'],
  ['Explanation', 'Explain how or why a phenomenon happens', 'General Statement → Sequenced Explanation', 'Passive & Cause-Effect'],
  ['Discussion', 'Compare two viewpoints fairly', 'Issue → Pros → Cons → Recommendation', 'Contrast Connectors'],
  ['News Item', 'Report newsworthy daily events', 'Newsworthy Event → Background → Sources', 'Past & Reported Speech'],
  ['Biography', 'Chronicle a real person’s life & impact', 'Orientation → Milestones → Legacy', '3rd-Person Past'],
];

export function ResourcesPage() {
  const [tab, setTab] = useState<'grammar' | 'phonetics' | 'verbs' | 'genres'>('grammar');
  const { say } = useSpeak();

  const { data } = useQuery({
    queryKey: ['resources'],
    queryFn: () =>
      api.get<{
        grammarRules: { id: string; title: string; formula: string; explanation: string; examples: string[]; level: string; lesson?: { slug: string; title: string } | null }[];
      }>('/learning/resources'),
  });

  return (
    <div>
      <PageHeader
        eyebrow="Resources Library"
        title="Quick Reference & Study Guides"
        subtitle="Bookmarkable grammar formulas, interactive IPA sound cards, irregular verbs, and the 13 English Text Types cheat sheet."
      />

      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'grammar', label: 'Grammar Formulas' },
          { value: 'phonetics', label: 'IPA Phonetics Chart' },
          { value: 'verbs', label: 'Irregular Verbs' },
          { value: 'genres', label: 'Text Types Guide' },
        ]}
      />

      {tab === 'grammar' && (
        <div className="grid gap-4 md:grid-cols-2">
          {data?.grammarRules.map((g) => (
            <div key={g.id} className="panel p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{g.title}</h2>
                <span className="chip">{g.level}</span>
              </div>
              <div className="mt-3 rounded-2xl bg-surface-2 px-4 py-2.5 font-mono text-sm font-bold text-cyan">{g.formula}</div>
              <p className="mt-3 text-sm text-muted">{g.explanation}</p>
              <ul className="mt-3 space-y-1 text-sm">
                {g.examples.map((ex, i) => (
                  <li key={i} className="flex items-center justify-between rounded-xl bg-surface-2/40 px-3 py-1.5">
                    <span>• {ex}</span>
                    <button onClick={() => say(ex)} aria-label="Listen" className="text-cyan">
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              {g.lesson && (
                <Link to={`/learn/lesson/${g.lesson.slug}`} className="mt-4 inline-block text-xs font-bold text-cyan hover:underline">
                  Study full lesson: {g.lesson.title} →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'phonetics' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {IPA_SOUNDS.map((s) => (
            <button key={s.symbol} onClick={() => say(s.sample)} className="panel panel-hover p-5 text-left">
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xl font-bold text-cyan">{s.symbol}</span>
                <Volume2 className="h-4 w-4 text-muted" />
              </div>
              <p className="mt-2 font-semibold">{s.sample}</p>
              <p className="mt-1 text-xs text-muted">{s.tip}</p>
            </button>
          ))}
        </div>
      )}

      {tab === 'verbs' && (
        <div className="panel overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 font-ui text-xs uppercase text-muted">
              <tr>
                <th className="px-5 py-3">Base (V1)</th>
                <th className="px-5 py-3">Past Simple (V2)</th>
                <th className="px-5 py-3">Past Participle (V3)</th>
                <th className="px-5 py-3">Listen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {IRREGULAR_VERBS.map(([v1, v2, v3]) => (
                <tr key={v1} className="hover:bg-surface-2/30">
                  <td className="px-5 py-3 font-bold text-cyan">{v1}</td>
                  <td className="px-5 py-3">{v2}</td>
                  <td className="px-5 py-3">{v3}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => say(`${v1}, ${v2.replace('/red/', '')}, ${v3.replace('/red/', '')}`)} className="text-cyan">
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'genres' && (
        <div className="panel overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 font-ui text-xs uppercase text-muted">
              <tr>
                <th className="px-5 py-3">Text Type</th>
                <th className="px-5 py-3">Social Purpose</th>
                <th className="px-5 py-3">Generic Structure</th>
                <th className="px-5 py-3">Grammar Spotlight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {TEXT_TYPES_GUIDE.map(([name, purpose, structure, grammar]) => (
                <tr key={name} className="hover:bg-surface-2/30">
                  <td className="px-5 py-3.5 font-bold text-cyan">{name}</td>
                  <td className="px-5 py-3.5">{purpose}</td>
                  <td className="px-5 py-3.5 text-muted">{structure}</td>
                  <td className="px-5 py-3.5">{grammar}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
