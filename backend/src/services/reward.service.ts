import { Prisma, type Skill } from '@prisma/client';
import { dayKey, levelFromXp, weekKey, type RewardSummary } from '@fec/shared';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';

/**
 * REWARD SERVICE — the ONLY place where XP, coins, levels, streaks, missions,
 * achievements and leaderboard rows are mutated.
 *
 * Idempotency: every grant is keyed by (userId, sourceKey) with a UNIQUE constraint on
 * XpTransaction, so replaying a request (double click, retry, tampering) can never pay twice.
 *
 * NOTE: deliberately avoids interactive transactions so it is safe with a single-connection
 * pool (the bundled PGlite dev database). Never call this from inside prisma.$transaction(cb).
 */

export type Metric =
  | 'lessons_completed'
  | 'exercises_completed'
  | 'perfect_exercises'
  | 'correct_answers'
  | 'xp_earned'
  | 'xp_total'
  | 'level'
  | 'streak_days'
  | 'games_played'
  | 'dash_distance'
  | 'puzzles_solved'
  | 'city_buildings'
  | 'sim_conversations'
  | 'adventure_chapters'
  | 'assessments_passed'
  | 'assessments_completed'
  | 'ai_messages'
  | 'vocab_reviewed'
  | 'vocab_mastered'
  | 'speaking_practice'
  | 'writing_practice'
  | 'posts_created'
  | 'achievements_earned'
  | 'items_owned';

export interface AwardOptions {
  /** LESSON | EXERCISE | GAME | MISSION | ACHIEVEMENT | ASSESSMENT | CITY | AI | COMMUNITY | ADMIN | SPEAKING | WRITING */
  source: string;
  /** Unique per user per reward, e.g. `lesson:<lessonId>` or `game:<sessionId>`. */
  sourceKey: string;
  xp?: number;
  coins?: number;
  note?: string;
  /** Logged to the activity feed (and learning minutes). */
  activity?: { type: string; title: string; refId?: string; skill?: Skill; minutes?: number };
  /** Increments applied to mission progress (daily/weekly). `xp_earned` is added automatically. */
  metrics?: Partial<Record<Metric, number>>;
  /** Restricts game-specific missions. */
  gameSlug?: string;
}

const emptySummary = (level: number): RewardSummary => ({ xp: 0, coins: 0, leveledUp: false, newLevel: level, achievements: [], items: [] });

export async function ensureStats(userId: string) {
  return prisma.playerStats.upsert({ where: { userId }, update: {}, create: { userId } });
}

export async function notify(userId: string, type: string, title: string, body: string, link?: string) {
  await prisma.notification.create({ data: { userId, type, title, body, link } });
}

/** Grant XP/coins + run all progression side effects. Safe to call repeatedly with the same sourceKey. */
export async function award(userId: string, opts: AwardOptions): Promise<RewardSummary> {
  const xp = Math.max(0, Math.round(opts.xp ?? 0));
  const coins = Math.round(opts.coins ?? 0);
  const before = await ensureStats(userId);

  try {
    await prisma.xpTransaction.create({
      data: { userId, amount: xp, coins, source: opts.source, sourceKey: opts.sourceKey, note: opts.note },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { ...emptySummary(before.level), duplicate: true };
    }
    throw e;
  }

  const summary = emptySummary(before.level);
  summary.xp = xp;
  summary.coins = coins;

  if (xp !== 0 || coins !== 0 || opts.activity?.minutes) {
    const after = await prisma.playerStats.update({
      where: { userId },
      data: {
        xp: { increment: xp },
        coins: { increment: coins },
        learningMinutes: { increment: opts.activity?.minutes ?? 0 },
      },
    });
    const newLevel = levelFromXp(after.xp);
    if (newLevel !== after.level) {
      await prisma.playerStats.update({ where: { userId }, data: { level: newLevel } });
      if (newLevel > before.level) {
        summary.leveledUp = true;
        summary.newLevel = newLevel;
        await notify(userId, 'LEVEL_UP', `Level ${newLevel} reached! 🚀`, `You are now level ${newLevel}. New rewards may be unlocked.`, '/achievements');
        summary.items.push(...(await grantLevelItems(userId, newLevel)));
      }
    }
    if (xp > 0) await bumpLeaderboard(userId, xp);
  }

  await touchStreak(userId);

  if (opts.activity) {
    await prisma.learningActivity.create({
      data: {
        userId,
        type: opts.activity.type,
        title: opts.activity.title,
        refId: opts.activity.refId,
        skill: opts.activity.skill,
        minutes: opts.activity.minutes ?? 0,
        xp,
      },
    });
  }

  const metrics: Partial<Record<Metric, number>> = { ...(opts.metrics ?? {}) };
  if (xp > 0) metrics.xp_earned = (metrics.xp_earned ?? 0) + xp;
  await progressMissions(userId, metrics, opts.gameSlug);

  // Achievements (may cascade: achievement XP can unlock XP achievements).
  if (opts.source !== 'ACHIEVEMENT') {
    for (let i = 0; i < 3; i++) {
      const unlocked = await checkAchievements(userId);
      if (!unlocked.length) break;
      for (const a of unlocked) {
        summary.achievements.push({ slug: a.slug, title: a.title, icon: a.icon });
        const r = await award(userId, {
          source: 'ACHIEVEMENT',
          sourceKey: `achievement:${a.slug}`,
          xp: a.xpReward,
          coins: a.coinReward,
          note: a.title,
          activity: { type: 'ACHIEVEMENT', title: `Unlocked “${a.title}”`, refId: a.id },
        });
        summary.xp += r.xp;
        summary.coins += r.coins;
        if (r.leveledUp) {
          summary.leveledUp = true;
          summary.newLevel = Math.max(summary.newLevel, r.newLevel);
        }
        summary.items.push(...r.items);
        if (a.itemRewardSlug) {
          const item = await grantItem(userId, a.itemRewardSlug, 'achievement');
          if (item) summary.items.push(item);
        }
      }
    }
  }

  return summary;
}

async function bumpLeaderboard(userId: string, xp: number) {
  for (const periodKey of ['all', weekKey()]) {
    await prisma.leaderboardEntry.upsert({
      where: { userId_periodKey: { userId, periodKey } },
      update: { xp: { increment: xp } },
      create: { userId, periodKey, xp },
    });
  }
}

/** Updates the daily streak. Called on every rewarded activity. */
export async function touchStreak(userId: string) {
  const stats = await ensureStats(userId);
  const today = dayKey();
  if (stats.lastActiveDay === today) return stats;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const streak = stats.lastActiveDay === dayKey(y) ? stats.streak + 1 : 1;
  const longest = Math.max(stats.longestStreak, streak);
  const updated = await prisma.playerStats.update({ where: { userId }, data: { streak, longestStreak: longest, lastActiveDay: today } });
  if ([3, 7, 14, 30, 50, 100, 365].includes(streak)) {
    await notify(userId, 'STREAK', `🔥 ${streak}-day streak!`, `You have learned ${streak} days in a row. Keep the fire burning!`, '/progress');
  }
  return updated;
}

/* ------------------------------- Missions ------------------------------- */

export function periodKeyFor(period: 'DAILY' | 'WEEKLY') {
  return period === 'DAILY' ? dayKey() : weekKey();
}

export async function progressMissions(userId: string, metrics: Partial<Record<Metric, number>>, gameSlug?: string) {
  const entries = Object.entries(metrics).filter(([, v]) => (v ?? 0) > 0) as [Metric, number][];
  if (!entries.length) return;
  const missions = await prisma.mission.findMany({
    where: { isActive: true, metric: { in: entries.map(([m]) => m) } },
  });
  for (const m of missions) {
    if (m.gameSlug && m.gameSlug !== gameSlug) continue;
    const inc = metrics[m.metric as Metric] ?? 0;
    const periodKey = periodKeyFor(m.period);
    // dash_distance-style missions are "best in one run" rather than cumulative
    const isBest = m.metric === 'dash_distance';
    const existing = await prisma.userMission.findUnique({ where: { userId_missionId_periodKey: { userId, missionId: m.id, periodKey } } });
    if (existing?.completedAt) continue;
    const progress = isBest ? Math.max(existing?.progress ?? 0, inc) : (existing?.progress ?? 0) + inc;
    const done = progress >= m.target;
    await prisma.userMission.upsert({
      where: { userId_missionId_periodKey: { userId, missionId: m.id, periodKey } },
      update: { progress: Math.min(progress, m.target), completedAt: done ? new Date() : null },
      create: { userId, missionId: m.id, periodKey, progress: Math.min(progress, m.target), completedAt: done ? new Date() : null },
    });
    if (done) await notify(userId, 'MISSION', 'Mission complete! 🎯', `“${m.title}” is complete — claim your reward.`, '/dashboard');
  }
}

/** Lists the current daily + weekly missions with the user's progress. */
export async function listMissions(userId: string, gameSlug?: string) {
  const missions = await prisma.mission.findMany({
    where: { isActive: true, ...(gameSlug ? { gameSlug } : {}) },
    orderBy: [{ period: 'asc' }, { target: 'asc' }],
  });
  const rows = await prisma.userMission.findMany({
    where: { userId, missionId: { in: missions.map((m) => m.id) }, periodKey: { in: [dayKey(), weekKey()] } },
  });
  return missions.map((m) => {
    const um = rows.find((r) => r.missionId === m.id && r.periodKey === periodKeyFor(m.period));
    return {
      id: m.id,
      slug: m.slug,
      title: m.title,
      description: m.description,
      period: m.period,
      metric: m.metric,
      target: m.target,
      gameSlug: m.gameSlug,
      xpReward: m.xpReward,
      coinReward: m.coinReward,
      progress: um?.progress ?? 0,
      completed: !!um?.completedAt,
      claimed: !!um?.claimedAt,
    };
  });
}

/** Claim a completed mission. Atomic: the conditional update guarantees a single claim. */
export async function claimMission(userId: string, missionId: string): Promise<RewardSummary> {
  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission) throw new AppError(404, 'NOT_FOUND', 'Mission not found');
  const periodKey = periodKeyFor(mission.period);
  const res = await prisma.userMission.updateMany({
    where: { userId, missionId, periodKey, completedAt: { not: null }, claimedAt: null },
    data: { claimedAt: new Date() },
  });
  if (res.count === 0) throw new AppError(400, 'NOT_CLAIMABLE', 'Mission is not complete or was already claimed');
  return award(userId, {
    source: 'MISSION',
    sourceKey: `mission:${missionId}:${periodKey}`,
    xp: mission.xpReward,
    coins: mission.coinReward,
    note: mission.title,
    activity: { type: 'MISSION', title: `Mission claimed: ${mission.title}`, refId: missionId },
  });
}

/* ----------------------------- Achievements ----------------------------- */

async function count(sql: Prisma.Sql): Promise<number> {
  const rows = await prisma.$queryRaw<{ n: bigint | number | null }[]>(sql);
  return Number(rows[0]?.n ?? 0);
}

export async function metricValue(userId: string, metric: string): Promise<number> {
  switch (metric) {
    case 'lessons_completed':
      return prisma.lessonProgress.count({ where: { userId, status: 'COMPLETED' } });
    case 'exercises_completed':
      return prisma.exerciseAttempt.count({ where: { userId } });
    case 'perfect_exercises':
      return count(Prisma.sql`SELECT COUNT(*)::int AS n FROM "ExerciseAttempt" WHERE "userId" = ${userId} AND "score" = "total" AND "total" > 0`);
    case 'correct_answers': {
      const ex = await prisma.attemptAnswer.count({ where: { isCorrect: true, attempt: { userId } } });
      const g = await prisma.gameSession.aggregate({ where: { userId, status: 'COMPLETED' }, _sum: { correct: true } });
      return ex + (g._sum.correct ?? 0);
    }
    case 'xp_total':
      return (await ensureStats(userId)).xp;
    case 'level':
      return (await ensureStats(userId)).level;
    case 'streak_days':
      return (await ensureStats(userId)).longestStreak;
    case 'games_played':
      return prisma.gameSession.count({ where: { userId, status: 'COMPLETED' } });
    case 'dash_distance':
      return (await prisma.gameProgress.findUnique({ where: { userId_gameSlug: { userId, gameSlug: 'english-dash' } } }))?.bestDistance ?? 0;
    case 'puzzles_solved':
      return prisma.gameSession.count({ where: { userId, status: 'COMPLETED', gameSlug: 'word-puzzle' } });
    case 'sim_conversations':
      return prisma.gameSession.count({ where: { userId, status: 'COMPLETED', gameSlug: 'life-simulator' } });
    case 'adventure_chapters':
      return (await prisma.gameProgress.findUnique({ where: { userId_gameSlug: { userId, gameSlug: 'english-adventure' } } }))?.level ?? 0;
    case 'city_buildings': {
      const c = await prisma.cityState.findUnique({ where: { userId } });
      return Array.isArray(c?.buildings) ? (c!.buildings as unknown[]).length : 0;
    }
    case 'assessments_passed':
      return prisma.assessmentAttempt.count({ where: { userId, passed: true } });
    case 'assessments_completed':
      return prisma.assessmentAttempt.count({ where: { userId } });
    case 'ai_messages':
      return prisma.aiMessage.count({ where: { role: 'user', conversation: { userId } } });
    case 'vocab_mastered':
      return prisma.vocabMastery.count({ where: { userId, strength: { gte: 3 } } });
    case 'vocab_reviewed':
      return prisma.vocabMastery.count({ where: { userId } });
    case 'speaking_practice':
      return (await prisma.skillMastery.findUnique({ where: { userId_skill: { userId, skill: 'SPEAKING' } } }))?.activities ?? 0;
    case 'writing_practice':
      return (await prisma.skillMastery.findUnique({ where: { userId_skill: { userId, skill: 'WRITING' } } }))?.activities ?? 0;
    case 'posts_created':
      return prisma.communityPost.count({ where: { userId } });
    case 'achievements_earned':
      return prisma.userAchievement.count({ where: { userId } });
    case 'items_owned':
      return prisma.inventoryItem.count({ where: { userId } });
    default:
      return 0;
  }
}

/** Awards any achievements whose threshold is now met. Returns newly earned ones. */
export async function checkAchievements(userId: string) {
  const earned = await prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } });
  const pending = await prisma.achievement.findMany({ where: { id: { notIn: earned.map((e) => e.achievementId) } } });
  if (!pending.length) return [];
  const cache = new Map<string, number>();
  const unlocked = [];
  for (const a of pending) {
    if (!cache.has(a.metric)) cache.set(a.metric, await metricValue(userId, a.metric));
    if ((cache.get(a.metric) ?? 0) >= a.threshold) {
      try {
        await prisma.userAchievement.create({ data: { userId, achievementId: a.id } });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue;
        throw e;
      }
      unlocked.push(a);
      await notify(userId, 'ACHIEVEMENT', `Achievement unlocked: ${a.title}`, a.description, '/achievements');
    }
  }
  return unlocked;
}

/* -------------------------------- Items -------------------------------- */

export async function grantItem(userId: string, slug: string, source: string) {
  const item = await prisma.cosmeticItem.findUnique({ where: { slug } });
  if (!item) return null;
  try {
    await prisma.inventoryItem.create({ data: { userId, itemId: item.id, source } });
    return { slug: item.slug, name: item.name };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return null;
    throw e;
  }
}

/** Free cosmetics that unlock automatically at a level (priceCoins = 0, no achievement). */
async function grantLevelItems(userId: string, level: number) {
  const items = await prisma.cosmeticItem.findMany({
    where: { priceCoins: 0, achievementSlug: null, isDefault: false, unlockLevel: { lte: level } },
  });
  const granted: { slug: string; name: string }[] = [];
  for (const it of items) {
    const g = await grantItem(userId, it.slug, 'level');
    if (g) granted.push(g);
  }
  return granted;
}

/* ----------------------------- Skill mastery ----------------------------- */

export async function recordSkill(userId: string, skill: Skill, correct: number, attempts: number, activities = 0) {
  await prisma.skillMastery.upsert({
    where: { userId_skill: { userId, skill } },
    update: { correct: { increment: correct }, attempts: { increment: attempts }, activities: { increment: activities } },
    create: { userId, skill, correct, attempts, activities },
  });
}
