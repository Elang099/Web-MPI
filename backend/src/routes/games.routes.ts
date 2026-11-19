import { Router } from 'express';
import {
  GAME_SLUGS,
  LEVELS,
  XP_RULES,
  cityBuildSchema,
  cityMoveSchema,
  cityUpgradeSchema,
  gameFinishSchema,
  gameStartSchema,
  type GameFinishInput,
  type GameStartInput,
} from '@fec/shared';
import type { Level, Skill } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { requireAuth, uid } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { gameLimiter } from '../middleware/rateLimit.js';
import { AppError, asyncHandler, badRequest, forbidden, notFound } from '../utils/errors.js';
import { grade, toPublicQuestion } from '../services/grading.service.js';
import { award, ensureStats, listMissions, recordSkill } from '../services/reward.service.js';
import { shuffle } from '../utils/crypto.js';

const router = Router();
router.use(requireAuth);

export const CITY_CATALOG = {
  library: { name: 'English Library', category: 'education', cost: { bricks: 25, wood: 15, books: 0 }, pop: 20, desc: 'Unlocks reading bonuses and grows population.' },
  academy: { name: 'Grammar Academy', category: 'education', cost: { bricks: 35, wood: 25, books: 5 }, pop: 35, desc: 'Trains grammar masters in your city.' },
  cafe: { name: 'Conversation Café', category: 'shop', cost: { bricks: 20, wood: 20, books: 2 }, pop: 25, desc: 'Citizens practice daily English dialogues.' },
  tower: { name: 'Vocab Radio Tower', category: 'tech', cost: { bricks: 40, wood: 15, books: 8 }, pop: 45, desc: 'Broadcasts English podcasts city-wide.' },
  cottage: { name: 'Scholar Cottage', category: 'housing', cost: { bricks: 15, wood: 20, books: 0 }, pop: 18, desc: 'Cozy home for learners.' },
  park: { name: 'Idiom Park', category: 'decor', cost: { bricks: 10, wood: 15, books: 0 }, pop: 12, desc: 'Green plaza decorated with English proverbs.' },
  cinema: { name: 'Story Cinema', category: 'shop', cost: { bricks: 30, wood: 25, books: 6 }, pop: 35, desc: 'Screens short stories & listening reels.' },
  studio: { name: 'AI Speech Studio', category: 'tech', cost: { bricks: 45, wood: 20, books: 10 }, pop: 55, desc: 'Cutting-edge pronunciation hub.' },
} as const;

type BuildingType = keyof typeof CITY_CATALOG;
interface CityBuilding {
  id: string;
  type: BuildingType;
  x: number;
  y: number;
  level: number;
}

/** GET /api/games/hub — overview of all 5 games, player's high scores, avatar, city, game missions */
router.get(
  '/hub',
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const [progress, avatar, city, missions, stats] = await Promise.all([
      prisma.gameProgress.findMany({ where: { userId } }),
      prisma.avatar.upsert({ where: { userId }, update: {}, create: { userId } }),
      prisma.cityState.upsert({ where: { userId }, update: {}, create: { userId } }),
      listMissions(userId),
      ensureStats(userId),
    ]);
    res.json({
      progress,
      avatar,
      city,
      missions: missions.filter((m) => m.gameSlug || m.metric === 'games_played' || m.metric === 'xp_earned'),
      stats,
    });
  }),
);

/** GET /api/games/questions — fetch stripped questions for a game (without starting a session, e.g. preview/practice) */
router.get(
  '/questions',
  asyncHandler(async (req, res) => {
    const gameSlug = typeof req.query.gameSlug === 'string' && (GAME_SLUGS as readonly string[]).includes(req.query.gameSlug) ? req.query.gameSlug : undefined;
    const level = typeof req.query.level === 'string' && (LEVELS as readonly string[]).includes(req.query.level) ? (req.query.level as Level) : undefined;
    const count = Math.min(30, Math.max(5, Number(req.query.count ?? 12)));
    const pool = await prisma.question.findMany({
      where: {
        ...(gameSlug ? { OR: [{ gameSlug }, { gameSlug: null, exerciseId: { not: null } }] } : {}),
        ...(level ? { level } : {}),
      },
      take: 100,
    });
    res.json({ questions: shuffle(pool).slice(0, count).map(toPublicQuestion) });
  }),
);

/** POST /api/games/sessions/start — creates a server-issued session with authoritative questions */
router.post(
  '/sessions/start',
  gameLimiter,
  validate(gameStartSchema),
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const { gameSlug, mode, level } = req.body as GameStartInput;

    // Issue questions tailored to this game first, then top up with compatible extra questions.
    const gameBank = await prisma.question.findMany({
      where: { gameSlug, ...(level ? { level } : {}) },
      take: 80,
    });
    const extraTypes = gameSlug === 'english-dash' ? ['MCQ'] : ['MCQ', 'TRUE_FALSE', 'FILL'];
    const extraBank =
      gameBank.length < 15
        ? await prisma.question.findMany({
            where: { gameSlug: null, exerciseId: { not: null }, type: { in: extraTypes as never }, ...(level ? { level } : {}) },
            take: 40,
          })
        : [];
    const picked = [...shuffle(gameBank), ...shuffle(extraBank)].slice(0, 18);

    const session = await prisma.gameSession.create({
      data: {
        userId,
        gameSlug,
        mode,
        questionIds: picked.map((q) => q.id),
      },
    });

    res.status(201).json({
      sessionId: session.id,
      gameSlug,
      mode,
      questions: picked.map(toPublicQuestion),
    });
  }),
);

/** POST /api/games/sessions/:id/finish — grades answers server-side, prevents tampering & caps daily XP */
router.post(
  '/sessions/:id/finish',
  gameLimiter,
  validate(gameFinishSchema),
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const body = req.body as GameFinishInput;
    const session = await prisma.gameSession.findUnique({ where: { id: String(req.params.id) } });
    if (!session) throw notFound('Game session');
    if (session.userId !== userId) throw forbidden();
    if (session.status !== 'ACTIVE') throw new AppError(409, 'ALREADY_FINISHED', 'This game session has already been submitted');

    // Sanity bounds against score tampering
    const elapsedSec = Math.max(1, (Date.now() - session.startedAt.getTime()) / 1000);
    const distance = Math.min(body.distance ?? 0, Math.round(elapsedSec * 65 + 500));
    const coinsCollected = Math.min(body.coinsCollected ?? 0, Math.round(elapsedSec * 8 + 50));

    // Grade every submitted answer against the questions issued for this session
    const issued = await prisma.question.findMany({ where: { id: { in: session.questionIds } } });
    const byId = new Map(issued.map((q) => [q.id, q]));
    const graded = body.answers
      .filter((a) => byId.has(a.questionId))
      .map((a) => {
        const q = byId.get(a.questionId)!;
        return { ...grade(q, a.response), skill: q.skill };
      });

    const correct = graded.filter((g) => g.isCorrect).length;
    const wrong = graded.length - correct;

    // Record skill mastery
    const skillMap = new Map<Skill, { c: number; t: number }>();
    for (const g of graded) {
      const cur = skillMap.get(g.skill) ?? { c: 0, t: 0 };
      cur.t += 1;
      if (g.isCorrect) cur.c += 1;
      skillMap.set(g.skill, cur);
    }
    for (const [s, v] of skillMap) await recordSkill(userId, s, v.c, v.t);

    // Daily game XP cap check
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const gameToday = await prisma.xpTransaction.aggregate({
      where: { userId, source: 'GAME', createdAt: { gte: todayStart } },
      _sum: { amount: true },
    });
    const usedToday = gameToday._sum.amount ?? 0;
    const remainingCap = Math.max(0, XP_RULES.gameDailyXpCap - usedToday);

    // Server-derived XP & coins: rewards meaningful English answers + play effort
    const rawXp = Math.min(XP_RULES.gameMaxXpPerSession, correct * 8 + Math.min(25, Math.floor(body.score / 250)) + (elapsedSec >= 10 ? 8 : 2));
    const xpAwarded = Math.min(rawXp, remainingCap);
    const coinsAwarded = Math.min(XP_RULES.gameMaxCoinsPerSession, Math.floor(coinsCollected * 0.5) + correct * 6 + 8);

    await prisma.gameSession.update({
      where: { id: session.id },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        score: body.score,
        distance,
        coinsCollected,
        correct,
        wrong,
        xpAwarded,
        coinsAwarded,
        meta: body.meta as never,
      },
    });

    // Update GameProgress
    const prev = await prisma.gameProgress.findUnique({ where: { userId_gameSlug: { userId, gameSlug: session.gameSlug } } });
    const prevData = (prev?.data ?? {}) as Record<string, unknown>;
    const nextData: Record<string, unknown> = { ...prevData };
    if (session.gameSlug === 'english-adventure' && typeof body.meta?.chapter === 'number') {
      const unlocked = Math.max(Number(prevData.unlockedChapter ?? 1), Number(body.meta.chapter) + (body.meta.completed ? 1 : 0));
      nextData.unlockedChapter = Math.min(6, unlocked);
    }
    if (session.gameSlug === 'life-simulator' && typeof body.meta?.scene === 'string') {
      const doneScenes = new Set(Array.isArray(prevData.completedScenes) ? (prevData.completedScenes as string[]) : []);
      if (correct >= 2 || body.meta.completed) doneScenes.add(body.meta.scene);
      nextData.completedScenes = [...doneScenes];
    }

    await prisma.gameProgress.upsert({
      where: { userId_gameSlug: { userId, gameSlug: session.gameSlug } },
      update: {
        highScore: Math.max(prev?.highScore ?? 0, body.score),
        bestDistance: Math.max(prev?.bestDistance ?? 0, distance),
        totalPlays: { increment: 1 },
        totalCorrect: { increment: correct },
        level: session.gameSlug === 'english-adventure' ? Number(nextData.unlockedChapter ?? prev?.level ?? 1) : Math.max(prev?.level ?? 1, 1 + Math.floor(((prev?.totalCorrect ?? 0) + correct) / 10)),
        data: nextData as never,
      },
      create: {
        userId,
        gameSlug: session.gameSlug,
        highScore: body.score,
        bestDistance: distance,
        totalPlays: 1,
        totalCorrect: correct,
        level: session.gameSlug === 'english-adventure' ? Number(nextData.unlockedChapter ?? 1) : 1,
        data: nextData as never,
      },
    });

    // City Builder resources earned by English accuracy across ANY game (especially City missions)
    const earnedBricks = correct * 4 + (session.gameSlug === 'city-builder' ? 12 : 4);
    const earnedWood = correct * 3 + (session.gameSlug === 'city-builder' ? 10 : 3);
    const earnedBooks = correct >= 2 ? Math.floor(correct / 2) + 1 : 0;
    const earnedEnergy = Math.max(1, correct);
    await prisma.cityState.upsert({
      where: { userId },
      update: {
        bricks: { increment: earnedBricks },
        wood: { increment: earnedWood },
        books: { increment: earnedBooks },
        energy: { increment: earnedEnergy },
      },
      create: { userId, bricks: 50 + earnedBricks, wood: 50 + earnedWood, books: 10 + earnedBooks, energy: 20 + earnedEnergy },
    });

    const gameMetrics: Record<string, number> = {
      games_played: 1,
      correct_answers: correct,
    };
    if (session.gameSlug === 'english-dash') gameMetrics.dash_distance = distance;
    if (session.gameSlug === 'word-puzzle') gameMetrics.puzzles_solved = 1;
    if (session.gameSlug === 'life-simulator') gameMetrics.sim_conversations = 1;

    const reward = await award(userId, {
      source: 'GAME',
      sourceKey: `game:${session.id}`,
      xp: xpAwarded,
      coins: coinsAwarded,
      note: `${session.gameSlug} (score ${body.score})`,
      gameSlug: session.gameSlug,
      activity: {
        type: 'GAME',
        title: `Played ${session.gameSlug.replace(/-/g, ' ')} — ${correct} English challenges solved`,
        refId: session.id,
        minutes: Math.max(1, Math.round(elapsedSec / 60)),
      },
      metrics: gameMetrics,
    });

    res.json({
      sessionId: session.id,
      score: body.score,
      distance,
      correct,
      wrong,
      graded,
      resourcesEarned: { bricks: earnedBricks, wood: earnedWood, books: earnedBooks, energy: earnedEnergy },
      reward,
    });
  }),
);

/* ------------------------- City Builder ------------------------- */

function calcPopulation(buildings: CityBuilding[]): number {
  return buildings.reduce((sum, b) => sum + (CITY_CATALOG[b.type]?.pop ?? 10) * b.level, 0);
}

/** GET /api/games/city */
router.get(
  '/city',
  asyncHandler(async (req, res) => {
    const city = await prisma.cityState.upsert({ where: { userId: uid(req) }, update: {}, create: { userId: uid(req) } });
    res.json({ city, catalog: CITY_CATALOG });
  }),
);

/** PATCH /api/games/city/rename */
router.patch(
  '/city/rename',
  asyncHandler(async (req, res) => {
    const name = String(req.body?.name ?? '').trim().slice(0, 40);
    if (name.length < 2) throw badRequest('City name must be at least 2 characters');
    const city = await prisma.cityState.update({ where: { userId: uid(req) }, data: { name } });
    res.json({ city });
  }),
);

/** POST /api/games/city/build */
router.post(
  '/city/build',
  validate(cityBuildSchema),
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const { buildingType, x, y } = req.body as { buildingType: BuildingType; x: number; y: number };
    const spec = CITY_CATALOG[buildingType];
    if (!spec) throw badRequest('Unknown building type');

    const city = await prisma.cityState.upsert({ where: { userId }, update: {}, create: { userId } });
    const buildings = (Array.isArray(city.buildings) ? city.buildings : []) as unknown as CityBuilding[];
    if (buildings.some((b) => b.x === x && b.y === y)) throw badRequest('That tile already has a building');
    if (city.bricks < spec.cost.bricks || city.wood < spec.cost.wood || city.books < spec.cost.books) {
      throw badRequest('Not enough materials! Complete English missions or games to earn bricks, wood and books.');
    }

    const nextBuildings: CityBuilding[] = [...buildings, { id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type: buildingType, x, y, level: 1 }];
    const updated = await prisma.cityState.update({
      where: { userId },
      data: {
        bricks: { decrement: spec.cost.bricks },
        wood: { decrement: spec.cost.wood },
        books: { decrement: spec.cost.books },
        population: calcPopulation(nextBuildings),
        buildings: nextBuildings as never,
      },
    });

    const reward = await award(userId, {
      source: 'CITY',
      sourceKey: `city-build:${updated.buildings ? nextBuildings[nextBuildings.length - 1].id : Date.now()}`,
      xp: 15,
      coins: 10,
      note: `Built ${spec.name}`,
      metrics: { city_buildings: 1 },
    });

    res.json({ city: updated, reward });
  }),
);

/** POST /api/games/city/upgrade */
router.post(
  '/city/upgrade',
  validate(cityUpgradeSchema),
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const { buildingId } = req.body as { buildingId: string };
    const city = await prisma.cityState.findUniqueOrThrow({ where: { userId } });
    const buildings = (Array.isArray(city.buildings) ? city.buildings : []) as unknown as CityBuilding[];
    const idx = buildings.findIndex((b) => b.id === buildingId);
    if (idx < 0) throw notFound('Building');
    const b = buildings[idx];
    if (b.level >= 5) throw badRequest('Building is already at max level (5)');
    const mult = b.level;
    const spec = CITY_CATALOG[b.type];
    const cost = { bricks: spec.cost.bricks * mult, wood: spec.cost.wood * mult, books: Math.max(1, spec.cost.books) * mult };
    if (city.bricks < cost.bricks || city.wood < cost.wood || city.books < cost.books) throw badRequest('Not enough resources to upgrade');

    const nextBuildings = buildings.map((item, i) => (i === idx ? { ...item, level: item.level + 1 } : item));
    const updated = await prisma.cityState.update({
      where: { userId },
      data: {
        bricks: { decrement: cost.bricks },
        wood: { decrement: cost.wood },
        books: { decrement: cost.books },
        population: calcPopulation(nextBuildings),
        buildings: nextBuildings as never,
      },
    });

    const reward = await award(userId, {
      source: 'CITY',
      sourceKey: `city-upgrade:${b.id}:lv${b.level + 1}`,
      xp: 20,
      coins: 15,
      note: `Upgraded ${spec.name} to Lv.${b.level + 1}`,
    });

    res.json({ city: updated, reward });
  }),
);

/** POST /api/games/city/move */
router.post(
  '/city/move',
  validate(cityMoveSchema),
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const { buildingId, x, y } = req.body as { buildingId: string; x: number; y: number };
    const city = await prisma.cityState.findUniqueOrThrow({ where: { userId } });
    const buildings = (Array.isArray(city.buildings) ? city.buildings : []) as unknown as CityBuilding[];
    if (buildings.some((b) => b.id !== buildingId && b.x === x && b.y === y)) throw badRequest('Target tile is occupied');
    const nextBuildings = buildings.map((b) => (b.id === buildingId ? { ...b, x, y } : b));
    const updated = await prisma.cityState.update({ where: { userId }, data: { buildings: nextBuildings as never } });
    res.json({ city: updated });
  }),
);

export default router;
