import type { LessonBlock, LessonSeed, QuestionSeed, TopicSeed } from '@fec/shared';

type Skill = NonNullable<QuestionSeed['skill']>;
type Level = LessonSeed['level'];

export const mcq = (
  prompt: string,
  options: string[],
  answer: string,
  explanation: string,
  skill: Skill = 'GRAMMAR',
  level: Level = 'BEGINNER',
): QuestionSeed => ({
  type: 'MCQ',
  prompt,
  data: { options },
  answer,
  explanation,
  skill,
  level,
});

export const fill = (
  prompt: string,
  answer: string,
  explanation: string,
  hint?: string,
  skill: Skill = 'GRAMMAR',
  level: Level = 'BEGINNER',
): QuestionSeed => ({
  type: 'FILL',
  prompt,
  data: { hint },
  answer,
  explanation,
  skill,
  level,
});

export const order = (
  prompt: string,
  tokens: string[],
  answer: string,
  explanation: string,
  skill: Skill = 'GRAMMAR',
  level: Level = 'BEGINNER',
): QuestionSeed => ({
  type: 'ORDER',
  prompt,
  data: { tokens },
  answer,
  explanation,
  skill,
  level,
});

export const match = (
  prompt: string,
  pairs: [string, string][],
  explanation: string,
  skill: Skill = 'VOCABULARY',
  level: Level = 'BEGINNER',
): QuestionSeed => ({
  type: 'MATCH',
  prompt,
  data: {
    left: pairs.map(([l]) => l),
    right: pairs.map(([, r]) => r).sort(),
  },
  answer: pairs.map(([l, r]) => `${l}=>${r}`),
  explanation,
  skill,
  level,
});

export const tf = (
  prompt: string,
  answer: 'True' | 'False',
  explanation: string,
  skill: Skill = 'READING',
  level: Level = 'BEGINNER',
): QuestionSeed => ({
  type: 'TRUE_FALSE',
  prompt,
  data: { options: ['True', 'False'] },
  answer,
  explanation,
  skill,
  level,
});

export const listen = (
  prompt: string,
  audioText: string,
  options: string[],
  answer: string,
  explanation: string,
  level: Level = 'BEGINNER',
): QuestionSeed => ({
  type: 'LISTEN',
  prompt,
  data: { audioText, options },
  answer,
  explanation,
  skill: 'LISTENING',
  level,
});

export const b = {
  objectives: (items: string[]): LessonBlock => ({ type: 'objectives', items }),
  text: (body: string, title?: string): LessonBlock => ({ type: 'text', title, body }),
  callout: (variant: 'tip' | 'note' | 'warning' | 'remember', body: string, title?: string): LessonBlock => ({
    type: 'callout',
    variant,
    title,
    body,
  }),
  formula: (parts: { label: string; value: string; color?: string }[], example?: string, title?: string): LessonBlock => ({
    type: 'formula',
    title,
    parts,
    example,
  }),
  examples: (items: { en: string; note?: string; wrong?: boolean }[], title?: string): LessonBlock => ({
    type: 'examples',
    title,
    items,
  }),
  table: (headers: string[], rows: string[][], title?: string): LessonBlock => ({ type: 'table', title, headers, rows }),
  wordCards: (
    cards: { word: string; phonetic?: string; pos?: string; meaning: string; example?: string; emoji?: string }[],
    title?: string,
  ): LessonBlock => ({ type: 'wordCards', title, cards }),
  dialogue: (lines: { speaker: string; text: string }[], title?: string, context?: string): LessonBlock => ({
    type: 'dialogue',
    title,
    context,
    lines,
  }),
  reading: (title: string, passage: string, glossary?: { word: string; meaning: string }[]): LessonBlock => ({
    type: 'reading',
    title,
    passage,
    glossary,
  }),
  audio: (text: string, title?: string, transcriptHidden = false): LessonBlock => ({
    type: 'audio',
    title,
    text,
    transcriptHidden,
  }),
  expandable: (items: { title: string; body: string }[], title?: string): LessonBlock => ({ type: 'expandable', title, items }),
  steps: (items: { title: string; body: string }[], title?: string): LessonBlock => ({ type: 'steps', title, items }),
  timeline: (markers: { position: number; label: string; span?: number }[], caption?: string, title?: string): LessonBlock => ({
    type: 'timeline',
    title,
    markers,
    caption,
  }),
  sentenceBuilder: (prompt: string, words: string[], answer: string): LessonBlock => ({
    type: 'sentenceBuilder',
    prompt,
    words,
    answer,
  }),
  quickCheck: (question: string, options: string[], answer: string, explanation: string): LessonBlock => ({
    type: 'quickCheck',
    question,
    options,
    answer,
    explanation,
  }),
  sort: (prompt: string, buckets: string[], items: { text: string; bucket: string }[]): LessonBlock => ({
    type: 'sort',
    prompt,
    buckets,
    items,
  }),
  speaking: (prompt: string, sample: string, tips?: string[]): LessonBlock => ({
    type: 'speakingPrompt',
    prompt,
    sample,
    tips,
  }),
  writing: (prompt: string, minWords: number, checklist?: string[], modelAnswer?: string): LessonBlock => ({
    type: 'writingPrompt',
    prompt,
    minWords,
    checklist,
    modelAnswer,
  }),
};

export const makeTopic = (
  slug: string,
  category: TopicSeed['category'],
  title: string,
  description: string,
  lessons: LessonSeed[],
): TopicSeed => ({ slug, category, title, description, lessons });
