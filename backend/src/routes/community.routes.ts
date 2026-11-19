import { Router } from 'express';
import { postCreateSchema, reportCreateSchema, weekKey } from '@fec/shared';
import { prisma } from '../lib/prisma.js';
import { optionalAuth, requireAuth, uid } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, forbidden, notFound } from '../utils/errors.js';
import { publicUser } from '../services/user.service.js';
import { award } from '../services/reward.service.js';

const router = Router();

/** GET /api/community/leaderboard?period=weekly|all */
router.get(
  '/leaderboard',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const period = req.query.period === 'all' ? 'all' : weekKey();
    const entries = await prisma.leaderboardEntry.findMany({
      where: {
        periodKey: period,
        user: { isBanned: false, settings: { is: { showOnLeaderboard: true } } },
      },
      orderBy: { xp: 'desc' },
      take: 30,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profile: { select: { isPublic: true, cefr: true, audience: true } },
            stats: { select: { level: true, streak: true } },
            avatar: { select: { outfit: true, hairStyle: true, hairColor: true, skinTone: true, accessory: true, expression: true } },
          },
        },
      },
    });

    const board = entries.map((e, idx) => ({
      rank: idx + 1,
      xp: e.xp,
      level: e.user.stats?.level ?? 1,
      streak: e.user.stats?.streak ?? 0,
      cefr: e.user.profile?.cefr ?? null,
      avatar: e.user.avatar,
      user: publicUser(e.user),
      isMe: e.userId === req.user?.id,
    }));

    res.json({ period, board });
  }),
);

/** GET /api/community/challenges */
router.get(
  '/challenges',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const challenges = await prisma.challenge.findMany({
      orderBy: { endsAt: 'asc' },
      include: { _count: { select: { entries: true } } },
    });
    const mine = req.user
      ? await prisma.challengeEntry.findMany({ where: { userId: req.user.id } })
      : [];
    const mineMap = new Map(mine.map((m) => [m.challengeId, m]));

    res.json({
      challenges: challenges.map((c) => ({
        ...c,
        participants: c._count.entries,
        entry: mineMap.get(c.id) ?? null,
      })),
    });
  }),
);

/** POST /api/community/challenges/:id/join */
router.post(
  '/challenges/:id/join',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const challengeId = String(req.params.id);
    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw notFound('Challenge');
    const entry = await prisma.challengeEntry.upsert({
      where: { userId_challengeId: { userId, challengeId } },
      update: {},
      create: { userId, challengeId },
    });
    res.json({ entry });
  }),
);

/** GET /api/community/posts */
router.get(
  '/posts',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const posts = await prisma.communityPost.findMany({
      where: { isHidden: false, user: { isBanned: false } },
      orderBy: { createdAt: 'desc' },
      take: 40,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profile: { select: { isPublic: true, cefr: true } },
            stats: { select: { level: true } },
          },
        },
        reactions: true,
      },
    });

    res.json({
      posts: posts.map((p) => {
        const counts: Record<string, number> = {};
        const myReactions: string[] = [];
        for (const r of p.reactions) {
          counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;
          if (r.userId === req.user?.id) myReactions.push(r.emoji);
        }
        return {
          id: p.id,
          type: p.type,
          content: p.content,
          createdAt: p.createdAt,
          user: { ...publicUser(p.user), level: p.user.stats?.level ?? 1, cefr: p.user.profile?.cefr ?? null },
          isMine: p.userId === req.user?.id,
          reactions: counts,
          myReactions,
        };
      }),
    });
  }),
);

/** POST /api/community/posts */
router.post(
  '/posts',
  requireAuth,
  validate(postCreateSchema),
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const { content, type } = req.body as { content: string; type: 'TEXT' | 'MILESTONE' };
    const post = await prisma.communityPost.create({ data: { userId, content, type } });
    const reward = await award(userId, {
      source: 'COMMUNITY',
      sourceKey: `post:${post.id}`,
      xp: 5,
      coins: 5,
      note: 'Shared in Community',
      metrics: { posts_created: 1 },
    });
    res.status(201).json({ post, reward });
  }),
);

/** POST /api/community/posts/:id/react */
router.post(
  '/posts/:id/react',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const postId = String(req.params.id);
    const emoji = ['👏', '🔥', '🚀', '💡'].includes(String(req.body?.emoji)) ? String(req.body.emoji) : '👏';
    const existing = await prisma.postReaction.findUnique({ where: { userId_postId_emoji: { userId, postId, emoji } } });
    if (existing) {
      await prisma.postReaction.delete({ where: { id: existing.id } });
      return res.json({ active: false });
    }
    await prisma.postReaction.create({ data: { userId, postId, emoji } });
    res.json({ active: true });
  }),
);

/** DELETE /api/community/posts/:id */
router.delete(
  '/posts/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const post = await prisma.communityPost.findUnique({ where: { id: String(req.params.id) } });
    if (!post) throw notFound('Post');
    if (post.userId !== uid(req) && req.user?.role !== 'ADMIN') throw forbidden();
    await prisma.communityPost.delete({ where: { id: post.id } });
    res.json({ ok: true });
  }),
);

/** POST /api/community/posts/:id/report */
router.post(
  '/posts/:id/report',
  requireAuth,
  validate(reportCreateSchema),
  asyncHandler(async (req, res) => {
    const postId = String(req.params.id);
    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw notFound('Post');
    await prisma.contentReport.upsert({
      where: { reporterId_postId: { reporterId: uid(req), postId } },
      update: { reason: req.body.reason },
      create: { reporterId: uid(req), postId, reason: req.body.reason },
    });
    res.json({ ok: true });
  }),
);

export default router;
