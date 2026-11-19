import { Router } from 'express';
import { SKILLS, dayKey, levelProgress } from '@fec/shared';
import { prisma } from '../lib/prisma.js';
import { requireAuth, uid } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';
import { claimMission, ensureStats, listMissions, metricValue } from '../services/reward.service.js';
import { loadUser } from '../services/user.service.js';

const router = Router();
router.use(requireAuth);

/** GET /api/progress/dashboard — full personalized home dashboard payload */
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const [user, settings, stats, lessonsTotal, lessonsDone, skillRows, recentActivities, missions, paths, enrolled, achievementsEarned, totalAchievements, gameProgress, challenges] =
      await Promise.all([
        loadUser(userId),
        prisma.userSettings.upsert({ where: { userId }, update: {}, create: { userId } }),
        ensureStats(userId),
        prisma.lesson.count({ where: { isPublished: true } }),
        prisma.lessonProgress.count({ where: { userId, status: 'COMPLETED' } }),
        prisma.skillMastery.findMany({ where: { userId } }),
        prisma.learningActivity.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 10 }),
        listMissions(userId),
        prisma.learningPath.findMany({
          orderBy: { order: 'asc' },
          include: { steps: { orderBy: { order: 'asc' }, include: { lesson: { select: { id: true, slug: true, title: true, level: true, durationMin: true, emoji: true } } } } },
        }),
        prisma.pathEnrollment.findMany({ where: { userId }, select: { pathId: true } }),
        prisma.userAchievement.findMany({ where: { userId }, include: { achievement: true }, orderBy: { earnedAt: 'desc' }, take: 6 }),
        prisma.achievement.count(),
        prisma.gameProgress.findMany({ where: { userId } }),
        prisma.challenge.findMany({ where: { endsAt: { gte: new Date() } }, orderBy: { endsAt: 'asc' }, take: 3 }),
      ]);

    const completedLessonIds = new Set(
      (await prisma.lessonProgress.findMany({ where: { userId, status: 'COMPLETED' }, select: { lessonId: true } })).map((l) => l.lessonId),
    );

    // Today's XP towards daily goal
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayTx = await prisma.xpTransaction.aggregate({
      where: { userId, createdAt: { gte: startOfToday }, amount: { gt: 0 } },
      _sum: { amount: true },
    });
    const todayXp = todayTx._sum.amount ?? 0;

    // 7-day XP + activity minutes chart
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const weekTx = await prisma.xpTransaction.findMany({
      where: { userId, createdAt: { gte: sevenDaysAgo }, amount: { gt: 0 } },
      select: { amount: true, createdAt: true },
    });
    const weeklyMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      weeklyMap.set(dayKey(d), 0);
    }
    for (const tx of weekTx) {
      const k = dayKey(tx.createdAt);
      if (weeklyMap.has(k)) weeklyMap.set(k, (weeklyMap.get(k) ?? 0) + tx.amount);
    }
    const weekly = [...weeklyMap.entries()].map(([date, xp]) => ({
      date,
      label: new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' }),
      xp,
    }));

    // Skill mastery map with weak-area detection
    const skills = SKILLS.map((skill) => {
      const r = skillRows.find((s) => s.skill === skill);
      const attempts = r?.attempts ?? 0;
      const correct = r?.correct ?? 0;
      const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
      return { skill, correct, attempts, activities: r?.activities ?? 0, accuracy };
    });
    const weakestSkills = [...skills].sort((a, b) => a.accuracy - b.accuracy || a.attempts - b.attempts).slice(0, 2);

    // Continue learning (latest in-progress lesson, or next uncompleted step in an enrolled/matching path)
    const inProgress = await prisma.lessonProgress.findFirst({
      where: { userId, status: 'IN_PROGRESS' },
      orderBy: { updatedAt: 'desc' },
      include: { lesson: { select: { id: true, slug: true, title: true, summary: true, level: true, durationMin: true, emoji: true, topic: { select: { title: true, category: true } } } } },
    });

    const recommendedLessons = await prisma.lesson.findMany({
      where: {
        isPublished: true,
        id: { notIn: [...completedLessonIds] },
      },
      orderBy: [{ level: 'asc' }, { order: 'asc' }],
      take: 4,
      select: { id: true, slug: true, title: true, summary: true, level: true, durationMin: true, xpReward: true, emoji: true, topic: { select: { title: true, category: true } } },
    });

    const enrolledSet = new Set(enrolled.map((e) => e.pathId));
    const pathSummaries = paths.map((p) => {
      const total = p.steps.length;
      const done = p.steps.filter((s) => completedLessonIds.has(s.lessonId)).length;
      return { id: p.id, slug: p.slug, title: p.title, level: p.level, color: p.color, enrolled: enrolledSet.has(p.id), completedSteps: done, totalSteps: total, percent: total ? Math.round((done / total) * 100) : 0 };
    });

    res.json({
      user,
      dailyGoal: { current: todayXp, target: settings.dailyGoalXp, percent: Math.min(100, Math.round((todayXp / settings.dailyGoalXp) * 100)) },
      levelProgress: levelProgress(stats.xp),
      stats: { ...stats, lessonsCompleted: lessonsDone, lessonsTotal },
      continueLesson: inProgress?.lesson ?? recommendedLessons[0] ?? null,
      recommendedLessons,
      weakestSkills,
      skills,
      weekly,
      recentActivities,
      missions,
      paths: pathSummaries,
      achievements: { earnedCount: await prisma.userAchievement.count({ where: { userId } }), totalCount: totalAchievements, recent: achievementsEarned.map((a) => ({ ...a.achievement, earnedAt: a.earnedAt })) },
      gameProgress,
      challenges,
    });
  }),
);

/** GET /api/progress/analytics — detailed analytics, weak area recommendations, vocab & attempt history */
router.get(
  '/analytics',
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const [stats, skillRows, attempts, vocabTotal, vocabMastered, vocabSeen, gameSessions, lessonProgress, xpHistory] = await Promise.all([
      ensureStats(userId),
      prisma.skillMastery.findMany({ where: { userId } }),
      prisma.exerciseAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: { exercise: { select: { title: true, skill: true, lesson: { select: { title: true, slug: true } } } } },
      }),
      prisma.vocabulary.count(),
      prisma.vocabMastery.count({ where: { userId, strength: { gte: 3 } } }),
      prisma.vocabMastery.count({ where: { userId } }),
      prisma.gameSession.findMany({ where: { userId, status: 'COMPLETED' }, orderBy: { startedAt: 'desc' }, take: 15 }),
      prisma.lessonProgress.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: { lesson: { select: { title: true, slug: true, level: true, topic: { select: { category: true, title: true } } } } },
      }),
      prisma.xpTransaction.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);

    const skills = SKILLS.map((skill) => {
      const r = skillRows.find((s) => s.skill === skill);
      const attemptsCount = r?.attempts ?? 0;
      const correct = r?.correct ?? 0;
      return {
        skill,
        correct,
        attempts: attemptsCount,
        activities: r?.activities ?? 0,
        accuracy: attemptsCount ? Math.round((correct / attemptsCount) * 100) : 0,
      };
    });

    const weakSkills = skills.filter((s) => s.attempts === 0 || s.accuracy < 75).map((s) => s.skill);
    const recommendations = await prisma.lesson.findMany({
      where: {
        isPublished: true,
        progress: { none: { userId, status: 'COMPLETED' } },
      },
      take: 6,
      orderBy: { order: 'asc' },
      select: { id: true, slug: true, title: true, summary: true, level: true, emoji: true, topic: { select: { category: true, title: true } } },
    });

    res.json({
      stats,
      skills,
      weakSkills,
      vocabulary: { total: vocabTotal, mastered: vocabMastered, reviewed: vocabSeen },
      attempts,
      gameSessions,
      lessonProgress,
      xpHistory,
      recommendations,
    });
  }),
);

/** GET /api/progress/missions */
router.get(
  '/missions',
  asyncHandler(async (req, res) => {
    const gameSlug = typeof req.query.gameSlug === 'string' ? req.query.gameSlug : undefined;
    res.json({ missions: await listMissions(uid(req), gameSlug) });
  }),
);

/** POST /api/progress/missions/:id/claim */
router.post(
  '/missions/:id/claim',
  asyncHandler(async (req, res) => {
    const reward = await claimMission(uid(req), String(req.params.id));
    res.json({ ok: true, reward });
  }),
);

/** GET /api/progress/achievements */
router.get(
  '/achievements',
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const [all, earned] = await Promise.all([
      prisma.achievement.findMany({ orderBy: [{ category: 'asc' }, { threshold: 'asc' }] }),
      prisma.userAchievement.findMany({ where: { userId } }),
    ]);
    const earnedMap = new Map(earned.map((e) => [e.achievementId, e.earnedAt]));
    const metricCache = new Map<string, number>();
    const items = [];
    for (const a of all) {
      if (!metricCache.has(a.metric)) metricCache.set(a.metric, await metricValue(userId, a.metric));
      const current = metricCache.get(a.metric) ?? 0;
      const earnedAt = earnedMap.get(a.id) ?? null;
      items.push({
        ...a,
        earned: !!earnedAt,
        earnedAt,
        current: Math.min(current, a.threshold),
        percent: Math.min(100, Math.round((current / a.threshold) * 100)),
      });
    }
    res.json({ achievements: items });
  }),
);

export default router;
