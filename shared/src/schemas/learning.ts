import { z } from 'zod';
import { LEVELS, AUDIENCES, CATEGORIES, SKILLS } from '../constants';

/* ------------------------------------------------------------------ */
/* Lesson content blocks — rendered by frontend/src/learning/blocks    */
/* Lightweight markup allowed in `body` strings:                       */
/*   **bold**, *italic*, `code`, ==highlight==, and line breaks (\n).  */
/* ------------------------------------------------------------------ */

const color = z.string().optional();

export const blockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('objectives'), items: z.array(z.string()).min(1) }),
  z.object({ type: z.literal('text'), title: z.string().optional(), body: z.string() }),
  z.object({
    type: z.literal('callout'),
    variant: z.enum(['tip', 'note', 'warning', 'remember']),
    title: z.string().optional(),
    body: z.string(),
  }),
  z.object({
    type: z.literal('formula'),
    title: z.string().optional(),
    parts: z.array(z.object({ label: z.string(), value: z.string(), color })).min(1),
    example: z.string().optional(),
  }),
  z.object({
    type: z.literal('examples'),
    title: z.string().optional(),
    items: z.array(z.object({ en: z.string(), note: z.string().optional(), wrong: z.boolean().optional() })).min(1),
  }),
  z.object({
    type: z.literal('table'),
    title: z.string().optional(),
    headers: z.array(z.string()),
    rows: z.array(z.array(z.string())),
  }),
  z.object({
    type: z.literal('wordCards'),
    title: z.string().optional(),
    cards: z
      .array(
        z.object({
          word: z.string(),
          phonetic: z.string().optional(),
          pos: z.string().optional(),
          meaning: z.string(),
          example: z.string().optional(),
          emoji: z.string().optional(),
        }),
      )
      .min(1),
  }),
  z.object({
    type: z.literal('dialogue'),
    title: z.string().optional(),
    context: z.string().optional(),
    lines: z.array(z.object({ speaker: z.string(), text: z.string() })).min(1),
  }),
  z.object({
    type: z.literal('reading'),
    title: z.string(),
    passage: z.string(),
    glossary: z.array(z.object({ word: z.string(), meaning: z.string() })).optional(),
  }),
  /** Spoken with the browser's speech synthesis (no audio files needed). */
  z.object({ type: z.literal('audio'), title: z.string().optional(), text: z.string(), transcriptHidden: z.boolean().optional() }),
  z.object({
    type: z.literal('expandable'),
    title: z.string().optional(),
    items: z.array(z.object({ title: z.string(), body: z.string() })).min(1),
  }),
  z.object({
    type: z.literal('steps'),
    title: z.string().optional(),
    items: z.array(z.object({ title: z.string(), body: z.string() })).min(1),
  }),
  /** A tense/time diagram: markers placed on a past–now–future line. */
  z.object({
    type: z.literal('timeline'),
    title: z.string().optional(),
    markers: z.array(z.object({ position: z.number().min(0).max(100), label: z.string(), span: z.number().optional() })),
    caption: z.string().optional(),
  }),
  /** Interactive: tap words in order to build the sentence. */
  z.object({
    type: z.literal('sentenceBuilder'),
    prompt: z.string(),
    words: z.array(z.string()).min(2),
    answer: z.string(),
  }),
  /** Interactive: quick inline check with instant feedback (not graded). */
  z.object({
    type: z.literal('quickCheck'),
    question: z.string(),
    options: z.array(z.string()).min(2),
    answer: z.string(),
    explanation: z.string(),
  }),
  /** Interactive: sort items into buckets. */
  z.object({
    type: z.literal('sort'),
    prompt: z.string(),
    buckets: z.array(z.string()).min(2),
    items: z.array(z.object({ text: z.string(), bucket: z.string() })).min(2),
  }),
  /** Speaking practice — uses Web Speech recognition where supported. */
  z.object({
    type: z.literal('speakingPrompt'),
    prompt: z.string(),
    sample: z.string(),
    tips: z.array(z.string()).optional(),
  }),
  /** Writing practice — can be sent to the AI tutor for feedback. */
  z.object({
    type: z.literal('writingPrompt'),
    prompt: z.string(),
    minWords: z.number().int().positive(),
    checklist: z.array(z.string()).optional(),
    modelAnswer: z.string().optional(),
  }),
]);
export type LessonBlock = z.infer<typeof blockSchema>;

/* ------------------------------------------------------------------ */
/* Questions (exercises, assessments, games)                           */
/* `answer` is NEVER sent to the client for graded exercises.          */
/* ------------------------------------------------------------------ */

export const QUESTION_TYPES = ['MCQ', 'FILL', 'ORDER', 'MATCH', 'TRUE_FALSE', 'LISTEN'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

/**
 * data by type:
 *  MCQ / LISTEN / TRUE_FALSE: { options: string[], audioText?: string, passage?: string }
 *  FILL: { hint?: string, passage?: string }               answer: string (alternatives separated by "|")
 *  ORDER: { tokens: string[] }                             answer: string (the correct sentence)
 *  MATCH: { left: string[], right: string[] }              answer: string[] ("left=>right")
 */
export const questionDataSchema = z.object({
  options: z.array(z.string()).optional(),
  audioText: z.string().optional(),
  passage: z.string().optional(),
  hint: z.string().optional(),
  tokens: z.array(z.string()).optional(),
  left: z.array(z.string()).optional(),
  right: z.array(z.string()).optional(),
});

export const questionSeedSchema = z.object({
  type: z.enum(QUESTION_TYPES),
  prompt: z.string(),
  data: questionDataSchema.default({}),
  answer: z.union([z.string(), z.array(z.string())]),
  explanation: z.string(),
  skill: z.enum(SKILLS).optional(),
  level: z.enum(LEVELS).optional(),
  tags: z.array(z.string()).optional(),
});
export type QuestionSeed = z.infer<typeof questionSeedSchema>;

/** Shape of a lesson as authored in backend/prisma/content/*.ts */
export const lessonSeedSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  summary: z.string(),
  level: z.enum(LEVELS),
  audiences: z.array(z.enum(AUDIENCES)).min(1),
  durationMin: z.number().int().positive(),
  emoji: z.string().optional(),
  blocks: z.array(blockSchema).min(3),
  exercises: z.array(questionSeedSchema).min(3),
});
export type LessonSeed = z.infer<typeof lessonSeedSchema>;

export const topicSeedSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  category: z.enum(CATEGORIES),
  title: z.string(),
  description: z.string(),
  lessons: z.array(lessonSeedSchema).min(1),
});
export type TopicSeed = z.infer<typeof topicSeedSchema>;

/* ------------------------------------------------------------------ */
/* Client-facing DTOs                                                  */
/* ------------------------------------------------------------------ */

export interface PublicQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  data: z.infer<typeof questionDataSchema>;
  skill?: string | null;
}

export const submitAnswersSchema = z.object({
  answers: z
    .array(z.object({ questionId: z.string().min(1).max(64), response: z.union([z.string().max(500), z.array(z.string().max(200)).max(20)]) }))
    .min(1)
    .max(100),
  timeSpentSec: z.number().int().min(0).max(60 * 60 * 3).optional(),
});
export type SubmitAnswersInput = z.infer<typeof submitAnswersSchema>;

export interface GradedAnswer {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: string | string[];
  explanation: string;
}
