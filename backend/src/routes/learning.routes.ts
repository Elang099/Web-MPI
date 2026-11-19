import { Router } from 'express';
import type { Category, Level, Skill } from '@prisma/client';
import { CATEGORIES, LEVELS, SKILLS, XP_RULES, submitAnswersSchema, type SubmitAnswersInput } from '@fec/shared';
import { prisma } from '../lib/prisma.js';
import { optionalAuth, requireAuth, uid } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, badRequest, notFound } from '../utils/errors.js';
import { grade, toPublicQuestion } from '../services/grading.service.js';
import { award, recordSkill } from '../services/reward.service.js';

const router = Router();

/** GET /api/learning/topics — filter by category, level, audience, search */
router.get(
  '/topics',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const category = typeof req.query.category === 'string' && CATEGORIES.includes(req.query.category as Category) ? (req.query.category as Category) : undefined;
    const level = typeof req.query.level === 'string' && LEVELS.includes(req.query.level as Level) ? (req.query.level as Level) : undefined;
    const audience = typeof req.query.audience === 'string' && req.query.audience ? req.query.audience : undefined;
    const search = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;

    const topics = await prisma.topic.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { lessons: { some: { isPublished: true, title: { contains: search, mode: 'insensitive' } } } },
              ],
            }
          : {}),
      },
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
      include: {
        lessons: {
          where: {
            isPublished: true,
            ...(level ? { level } : {}),
            ...(audience ? { audiences: { has: audience } } : {}),
            ...(search
              ? {
                  OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { summary: { contains: search, mode: 'insensitive' } },
                  ],
                }
              : {}),
          },
          orderBy: { order: 'asc' },
          select: { id: true, slug: true, title: true, summary: true, level: true, audiences: true, durationMin: true, xpReward: true, emoji: true, order: true },
        },
      },
    });

    const userId = req.user?.id;
    const progressMap = new Map<string, { status: string; bestScore: number }>();
    if (userId) {
      const rows = await prisma.lessonProgress.findMany({ where: { userId }, select: { lessonId: true, status: true, bestScore: true } });
      for (const r of rows) progressMap.set(r.lessonId, { status: r.status, bestScore: r.bestScore });
    }

    const filtered = topics
      .filter((t) => t.lessons.length > 0 || (!level && !audience && !search))
      .map((t) => ({
        ...t,
        lessons: t.lessons.map((l) => ({
          ...l,
          progress: progressMap.get(l.id) ?? { status: 'NOT_STARTED', bestScore: 0 },
        })),
      }));

    res.json({ topics: filtered });
  }),
);

/** GET /api/learning/topics/:slug */
router.get(
  '/topics/:slug',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const topic = await prisma.topic.findUnique({
      where: { slug: String(req.params.slug) },
      include: {
        lessons: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
          select: { id: true, slug: true, title: true, summary: true, level: true, audiences: true, durationMin: true, xpReward: true, emoji: true, order: true },
        },
      },
    });
    if (!topic) throw notFound('Topic');

    const progressMap = new Map<string, { status: string; bestScore: number }>();
    if (req.user) {
      const rows = await prisma.lessonProgress.findMany({
        where: { userId: req.user.id, lessonId: { in: topic.lessons.map((l) => l.id) } },
      });
      for (const r of rows) progressMap.set(r.lessonId, { status: r.status, bestScore: r.bestScore });
    }

    res.json({
      topic: {
        ...topic,
        lessons: topic.lessons.map((l) => ({ ...l, progress: progressMap.get(l.id) ?? { status: 'NOT_STARTED', bestScore: 0 } })),
      },
    });
  }),
);

/** GET /api/learning/lessons/:slug — returns lesson blocks + stripped exercise questions */
router.get(
  '/lessons/:slug',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const lesson = await prisma.lesson.findUnique({
      where: { slug: String(req.params.slug) },
      include: {
        topic: true,
        exercises: { include: { questions: { orderBy: { order: 'asc' } } } },
        grammarRules: true,
      },
    });
    if (!lesson || (!lesson.isPublished && req.user?.role === 'STUDENT')) throw notFound('Lesson');

    let progress = { status: 'NOT_STARTED', bestScore: 0, timeSpentSec: 0 };
    if (req.user) {
      const p = await prisma.lessonProgress.findUnique({ where: { userId_lessonId: { userId: req.user.id, lessonId: lesson.id } } });
      if (p) progress = { status: p.status, bestScore: p.bestScore, timeSpentSec: p.timeSpentSec };
    }

    res.json({
      lesson: {
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        summary: lesson.summary,
        level: lesson.level,
        audiences: lesson.audiences,
        durationMin: lesson.durationMin,
        xpReward: lesson.xpReward,
        emoji: lesson.emoji,
        content: lesson.content,
        topic: lesson.topic,
        grammarRules: lesson.grammarRules,
        exercises: lesson.exercises.map((ex) => ({
          id: ex.id,
          title: ex.title,
          skill: ex.skill,
          questions: ex.questions.map(toPublicQuestion),
        })),
        progress,
      },
    });
  }),
);

/** POST /api/learning/lessons/:id/complete — mark lesson studied/completed & grant first-completion XP */
router.post(
  '/lessons/:id/complete',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const lesson = await prisma.lesson.findUnique({ where: { id: String(req.params.id) }, include: { topic: true } });
    if (!lesson) throw notFound('Lesson');
    const timeSpentSec = Math.min(3600, Math.max(0, Number(req.body?.timeSpentSec ?? 60)));

    const existing = await prisma.lessonProgress.findUnique({ where: { userId_lessonId: { userId, lessonId: lesson.id } } });
    const firstComplete = existing?.status !== 'COMPLETED';

    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId: lesson.id } },
      update: { status: 'COMPLETED', completedAt: existing?.completedAt ?? new Date(), timeSpentSec: { increment: timeSpentSec } },
      create: { userId, lessonId: lesson.id, status: 'COMPLETED', bestScore: 100, timeSpentSec, completedAt: new Date() },
    });

    const reward = await award(userId, {
      source: 'LESSON',
      sourceKey: `lesson:${lesson.id}`,
      xp: lesson.xpReward || XP_RULES.lessonComplete,
      coins: 15,
      note: lesson.title,
      activity: firstComplete ? { type: 'LESSON_COMPLETED', title: `Completed “${lesson.title}”`, refId: lesson.id, minutes: Math.max(1, Math.round(timeSpentSec / 60)) } : undefined,
      metrics: firstComplete ? { lessons_completed: 1 } : undefined,
    });

    res.json({ ok: true, firstComplete, reward });
  }),
);

/** POST /api/learning/exercises/:id/submit — server-side grading, mastery update, XP reward */
router.post(
  '/exercises/:id/submit',
  requireAuth,
  validate(submitAnswersSchema),
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const { answers, timeSpentSec = 0 } = req.body as SubmitAnswersInput;
    const exercise = await prisma.exercise.findUnique({
      where: { id: String(req.params.id) },
      include: { questions: true, lesson: true },
    });
    if (!exercise) throw notFound('Exercise');
    if (exercise.questions.length === 0) throw badRequest('Exercise has no questions');

    const byId = new Map(exercise.questions.map((q) => [q.id, q]));
    const graded = answers.map((a) => {
      const q = byId.get(a.questionId);
      if (!q) throw badRequest(`Question ${a.questionId} does not belong to this exercise`);
      return { ...grade(q, a.response), response: a.response, skill: q.skill };
    });

    const correctCount = graded.filter((g) => g.isCorrect).length;
    const total = exercise.questions.length;
    const percent = Math.round((correctCount / total) * 100);
    const isPerfect = correctCount === total;

    const attempt = await prisma.exerciseAttempt.create({
      data: {
        userId,
        exerciseId: exercise.id,
        score: correctCount,
        total,
        timeSpentSec,
        answers: {
          create: graded.map((g) => ({
            questionId: g.questionId,
            response: g.response as never,
            isCorrect: g.isCorrect,
          })),
        },
      },
    });

    const skillCounts = new Map<Skill, { c: number; t: number }>();
    for (const g of graded) {
      const s = skillCounts.get(g.skill) ?? { c: 0, t: 0 };
      s.t += 1;
      if (g.isCorrect) s.c += 1;
      skillCounts.set(g.skill, s);
    }
    for (const [skill, c] of skillCounts) {
      await recordSkill(userId, skill, c.c, c.t);
    }

    let firstPassLesson = false;
    if (exercise.lessonId) {
      const prev = await prisma.lessonProgress.findUnique({ where: { userId_lessonId: { userId, lessonId: exercise.lessonId } } });
      const passed = percent >= 60;
      firstPassLesson = passed && prev?.status !== 'COMPLETED';
      await prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId: exercise.lessonId } },
        update: {
          bestScore: Math.max(prev?.bestScore ?? 0, percent),
          status: passed ? 'COMPLETED' : prev?.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
          completedAt: passed ? prev?.completedAt ?? new Date() : prev?.completedAt ?? null,
          timeSpentSec: { increment: timeSpentSec },
        },
        create: {
          userId,
          lessonId: exercise.lessonId,
          bestScore: percent,
          status: passed ? 'COMPLETED' : 'IN_PROGRESS',
          completedAt: passed ? new Date() : null,
          timeSpentSec,
        },
      });
    }

    const priorCount = await prisma.exerciseAttempt.count({ where: { userId, exerciseId: exercise.id, id: { not: attempt.id } } });
    const baseXp = priorCount === 0 ? correctCount * XP_RULES.exerciseCorrect + (isPerfect ? XP_RULES.exercisePerfectBonus : 0) : Math.min(6, correctCount);
    const lessonBonus = firstPassLesson ? exercise.lesson?.xpReward ?? XP_RULES.lessonComplete : 0;

    const reward = await award(userId, {
      source: 'EXERCISE',
      sourceKey: `exercise:${attempt.id}`,
      xp: baseXp + lessonBonus,
      coins: correctCount * 3 + (isPerfect ? 10 : 0),
      note: exercise.title,
      activity: {
        type: 'EXERCISE',
        title: `Scored ${correctCount}/${total} on ${exercise.title}`,
        refId: exercise.id,
        skill: exercise.skill,
        minutes: Math.max(1, Math.round(timeSpentSec / 60)),
      },
      metrics: {
        exercises_completed: 1,
        correct_answers: correctCount,
        ...(isPerfect ? { perfect_exercises: 1 } : {}),
        ...(firstPassLesson ? { lessons_completed: 1 } : {}),
      },
    });

    res.json({ attemptId: attempt.id, score: correctCount, total, percent, isPerfect, results: graded, reward });
  }),
);

/** POST /api/learning/activity — log speaking or writing practice activity from interactive lesson blocks */
router.post(
  '/activity',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const kind = req.body?.kind === 'SPEAKING' ? 'SPEAKING' : 'WRITING';
    const title = String(req.body?.title ?? `${kind} practice`).slice(0, 120);
    const refId = typeof req.body?.refId === 'string' ? req.body.refId.slice(0, 64) : undefined;
    const score = Math.max(0, Math.min(100, Number(req.body?.score ?? 80)));

    await recordSkill(userId, kind, score >= 60 ? 1 : 0, 1, 1);
    const dayBucket = new Date().toISOString().slice(0, 13);
    const reward = await award(userId, {
      source: kind,
      sourceKey: `${kind.toLowerCase()}:${refId ?? 'free'}:${dayBucket}`,
      xp: 10,
      coins: 10,
      note: title,
      activity: { type: kind, title, refId, skill: kind, minutes: 2 },
      metrics: kind === 'SPEAKING' ? { speaking_practice: 1 } : { writing_practice: 1 },
    });

    res.json({ ok: true, reward });
  }),
);

/** GET /api/learning/paths */
router.get(
  '/paths',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const paths = await prisma.learningPath.findMany({
      orderBy: { order: 'asc' },
      include: {
        steps: {
          orderBy: { order: 'asc' },
          include: {
            lesson: { select: { id: true, slug: true, title: true, level: true, durationMin: true, xpReward: true, emoji: true } },
          },
        },
      },
    });

    const completedSet = new Set<string>();
    const enrolledSet = new Set<string>();
    if (req.user) {
      const [prog, enr] = await Promise.all([
        prisma.lessonProgress.findMany({ where: { userId: req.user.id, status: 'COMPLETED' }, select: { lessonId: true } }),
        prisma.pathEnrollment.findMany({ where: { userId: req.user.id }, select: { pathId: true } }),
      ]);
      for (const p of prog) completedSet.add(p.lessonId);
      for (const e of enr) enrolledSet.add(e.pathId);
    }

    res.json({
      paths: paths.map((p) => {
        const total = p.steps.length;
        const done = p.steps.filter((s) => completedSet.has(s.lessonId)).length;
        return {
          ...p,
          enrolled: enrolledSet.has(p.id),
          completedSteps: done,
          totalSteps: total,
          percent: total ? Math.round((done / total) * 100) : 0,
          steps: p.steps.map((s) => ({ ...s, completed: completedSet.has(s.lessonId) })),
        };
      }),
    });
  }),
);

/** POST /api/learning/paths/:id/enroll */
router.post(
  '/paths/:id/enroll',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const pathId = String(req.params.id);
    const path = await prisma.learningPath.findUnique({ where: { id: pathId } });
    if (!path) throw notFound('Learning path');
    await prisma.pathEnrollment.upsert({ where: { userId_pathId: { userId, pathId } }, update: {}, create: { userId, pathId } });
    res.json({ ok: true });
  }),
);

/** GET /api/learning/vocabulary — searchable & categorized word bank */
router.get(
  '/vocabulary',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const category = typeof req.query.category === 'string' && req.query.category ? req.query.category : undefined;
    const level = typeof req.query.level === 'string' && LEVELS.includes(req.query.level as Level) ? (req.query.level as Level) : undefined;
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;

    const words = await prisma.vocabulary.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(level ? { level } : {}),
        ...(q ? { OR: [{ word: { contains: q, mode: 'insensitive' } }, { meaning: { contains: q, mode: 'insensitive' } }] } : {}),
      },
      orderBy: [{ category: 'asc' }, { word: 'asc' }],
      take: 250,
    });

    const masteryMap = new Map<string, number>();
    if (req.user) {
      const m = await prisma.vocabMastery.findMany({ where: { userId: req.user.id, vocabularyId: { in: words.map((w) => w.id) } } });
      for (const r of m) masteryMap.set(r.vocabularyId, r.strength);
    }

    res.json({
      words: words.map((w) => ({ ...w, strength: masteryMap.get(w.id) ?? 0 })),
    });
  }),
);

/** POST /api/learning/vocabulary/:id/review — spaced repetition strength update */
router.post(
  '/vocabulary/:id/review',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const vocabId = String(req.params.id);
    const knew = Boolean(req.body?.knew ?? true);
    const existing = await prisma.vocabMastery.findUnique({ where: { userId_vocabularyId: { userId, vocabularyId: vocabId } } });
    const strength = Math.max(0, Math.min(5, (existing?.strength ?? 0) + (knew ? 1 : -1)));

    await prisma.vocabMastery.upsert({
      where: { userId_vocabularyId: { userId, vocabularyId: vocabId } },
      update: { strength, seen: { increment: 1 }, lastReviewed: new Date() },
      create: { userId, vocabularyId: vocabId, strength, seen: 1 },
    });
    await recordSkill(userId, 'VOCABULARY', knew ? 1 : 0, 1);

    const bucket = new Date().toISOString().slice(0, 13);
    const reward = await award(userId, {
      source: 'VOCAB',
      sourceKey: `vocab:${vocabId}:${bucket}`,
      xp: knew ? 3 : 1,
      coins: knew ? 2 : 0,
      metrics: { vocab_reviewed: 1 },
    });

    res.json({ strength, reward });
  }),
);

/** GET /api/learning/practice — build an interactive practice session by skill/level */
router.get(
  '/practice',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const skill = typeof req.query.skill === 'string' && SKILLS.includes(req.query.skill as Skill) ? (req.query.skill as Skill) : undefined;
    const level = typeof req.query.level === 'string' && LEVELS.includes(req.query.level as Level) ? (req.query.level as Level) : undefined;
    const limit = Math.min(20, Math.max(5, Number(req.query.limit ?? 8)));

    const pool = await prisma.question.findMany({
      where: {
        exerciseId: { not: null },
        ...(skill ? { skill } : {}),
        ...(level ? { level } : {}),
      },
      take: 80,
    });
    const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, limit);
    res.json({ questions: picked.map(toPublicQuestion) });
  }),
);

/** POST /api/learning/practice/grade — grade an ad-hoc practice set */
router.post(
  '/practice/grade',
  requireAuth,
  validate(submitAnswersSchema),
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const { answers, timeSpentSec = 0 } = req.body as SubmitAnswersInput;
    const questions = await prisma.question.findMany({ where: { id: { in: answers.map((a) => a.questionId) } } });
    const byId = new Map(questions.map((q) => [q.id, q]));
    const results = answers.map((a) => {
      const q = byId.get(a.questionId);
      if (!q) throw badRequest('Unknown question');
      return { ...grade(q, a.response), skill: q.skill };
    });

    const correct = results.filter((r) => r.isCorrect).length;
    const total = results.length;

    const skillGroups = new Map<Skill, { c: number; t: number }>();
    for (const r of results) {
      const s = skillGroups.get(r.skill) ?? { c: 0, t: 0 };
      s.t += 1;
      if (r.isCorrect) s.c += 1;
      skillGroups.set(r.skill, s);
    }
    for (const [s, v] of skillGroups) await recordSkill(userId, s, v.c, v.t);

    const reward = await award(userId, {
      source: 'PRACTICE',
      sourceKey: `practice:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      xp: Math.min(30, correct * 3 + (correct === total ? 5 : 0)),
      coins: correct * 2,
      note: 'Interactive Practice Drill',
      activity: { type: 'EXERCISE', title: `Practice Drill: ${correct}/${total} correct`, minutes: Math.max(1, Math.round(timeSpentSec / 60)) },
      metrics: { correct_answers: correct, exercises_completed: 1 },
    });

    res.json({ score: correct, total, percent: Math.round((correct / total) * 100), results, reward });
  }),
);

/** GET /api/learning/resources — grammar rules + reference cheatsheets */
router.get(
  '/resources',
  asyncHandler(async (_req, res) => {
    const [grammarRules, vocabCount, lessonsCount] = await Promise.all([
      prisma.grammarRule.findMany({ orderBy: [{ level: 'asc' }, { title: 'asc' }], include: { lesson: { select: { slug: true, title: true } } } }),
      prisma.vocabulary.count(),
      prisma.lesson.count({ where: { isPublished: true } }),
    ]);
    res.json({ grammarRules, counts: { vocabCount, lessonsCount } });
  }),
);

export default router;
