import { Router } from 'express';
import { adminCosmeticSchema, adminLessonSchema, adminTopicSchema, adminUserUpdateSchema } from '@fec/shared';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole, uid } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, badRequest, notFound } from '../utils/errors.js';

const router = Router();
router.use(requireAuth, requireRole('ADMIN', 'TEACHER'));

async function audit(actorId: string, action: string, target?: string, meta?: unknown) {
  await prisma.auditLog.create({ data: { actorId, action, target, meta: meta as never } });
}

/** GET /api/admin/overview — platform metrics & recent activity */
router.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    const [users, lessons, topics, vocab, gameSessions, certificates, announcements, reports, auditLogs, recentActivity] = await Promise.all([
      prisma.user.count(),
      prisma.lesson.count(),
      prisma.topic.count(),
      prisma.vocabulary.count(),
      prisma.gameSession.count({ where: { status: 'COMPLETED' } }),
      prisma.certificate.count({ where: { revoked: false } }),
      prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 15 }),
      prisma.contentReport.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          reporter: { select: { username: true } },
          post: { select: { id: true, content: true, isHidden: true, user: { select: { username: true } } } },
        },
      }),
      prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 25, include: { actor: { select: { username: true, role: true } } } }),
      prisma.learningActivity.findMany({ orderBy: { createdAt: 'desc' }, take: 15, include: { user: { select: { username: true } } } }),
    ]);

    res.json({
      counts: { users, lessons, topics, vocab, gameSessions, certificates },
      announcements,
      reports,
      auditLogs,
      recentActivity,
    });
  }),
);

/* ---------------------------- Users (ADMIN only for role/ban) ---------------------------- */

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const users = await prisma.user.findMany({
      where: q ? { OR: [{ email: { contains: q, mode: 'insensitive' } }, { username: { contains: q, mode: 'insensitive' } }, { displayName: { contains: q, mode: 'insensitive' } }] } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        isBanned: true,
        createdAt: true,
        lastLoginAt: true,
        stats: { select: { xp: true, level: true, streak: true, coins: true } },
        profile: { select: { audience: true, cefr: true } },
      },
    });
    res.json({ users });
  }),
);

router.patch(
  '/users/:id',
  requireRole('ADMIN'),
  validate(adminUserUpdateSchema),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (id === uid(req) && req.body.isBanned) throw badRequest('You cannot suspend yourself');
    const updated = await prisma.user.update({
      where: { id },
      data: req.body,
      select: { id: true, email: true, username: true, displayName: true, role: true, isBanned: true },
    });
    await audit(uid(req), 'USER_UPDATED', id, req.body);
    res.json({ user: updated });
  }),
);

/* ---------------------------- Content Management (Lessons, Topics, Vocab, Questions) ---------------------------- */

router.get(
  '/content',
  asyncHandler(async (_req, res) => {
    const [topics, lessons, paths, vocab, questions, achievements, missions, cosmetics] = await Promise.all([
      prisma.topic.findMany({ orderBy: [{ category: 'asc' }, { order: 'asc' }] }),
      prisma.lesson.findMany({ orderBy: { updatedAt: 'desc' }, include: { topic: { select: { title: true, category: true } } } }),
      prisma.learningPath.findMany({ orderBy: { order: 'asc' }, include: { steps: { orderBy: { order: 'asc' }, include: { lesson: { select: { id: true, title: true } } } } } }),
      prisma.vocabulary.findMany({ orderBy: { word: 'asc' }, take: 200 }),
      prisma.question.findMany({ orderBy: { order: 'asc' }, take: 200 }),
      prisma.achievement.findMany({ orderBy: { threshold: 'asc' } }),
      prisma.mission.findMany({ orderBy: [{ period: 'asc' }, { target: 'asc' }] }),
      prisma.cosmeticItem.findMany({ orderBy: [{ type: 'asc' }, { priceCoins: 'asc' }] }),
    ]);
    res.json({ topics, lessons, paths, vocab, questions, achievements, missions, cosmetics });
  }),
);

router.post(
  '/topics',
  validate(adminTopicSchema),
  asyncHandler(async (req, res) => {
    const topic = await prisma.topic.create({ data: req.body });
    await audit(uid(req), 'TOPIC_CREATED', topic.id, { slug: topic.slug });
    res.status(201).json({ topic });
  }),
);

router.post(
  '/lessons',
  validate(adminLessonSchema),
  asyncHandler(async (req, res) => {
    const lesson = await prisma.lesson.create({ data: req.body });
    await audit(uid(req), 'LESSON_CREATED', lesson.id, { slug: lesson.slug });
    res.status(201).json({ lesson });
  }),
);

router.patch(
  '/lessons/:id',
  validate(adminLessonSchema.partial()),
  asyncHandler(async (req, res) => {
    const lesson = await prisma.lesson.update({ where: { id: String(req.params.id) }, data: req.body });
    await audit(uid(req), 'LESSON_UPDATED', lesson.id, { slug: lesson.slug });
    res.json({ lesson });
  }),
);

router.delete(
  '/lessons/:id',
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    await prisma.lesson.delete({ where: { id } });
    await audit(uid(req), 'LESSON_DELETED', id);
    res.json({ ok: true });
  }),
);

router.post(
  '/vocabulary',
  asyncHandler(async (req, res) => {
    const { word, phonetic, partOfSpeech, meaning, example, category, level, synonyms, antonyms } = req.body ?? {};
    if (!word || !partOfSpeech || !meaning || !category) throw badRequest('Missing vocabulary fields');
    const item = await prisma.vocabulary.create({
      data: {
        word: String(word).trim(),
        phonetic: phonetic ? String(phonetic) : null,
        partOfSpeech: String(partOfSpeech),
        meaning: String(meaning),
        example: example ? String(example) : null,
        category: String(category),
        level: level ?? 'BEGINNER',
        synonyms: Array.isArray(synonyms) ? synonyms : [],
        antonyms: Array.isArray(antonyms) ? antonyms : [],
      },
    });
    await audit(uid(req), 'VOCAB_CREATED', item.id, { word: item.word });
    res.status(201).json({ item });
  }),
);

router.delete(
  '/vocabulary/:id',
  asyncHandler(async (req, res) => {
    await prisma.vocabulary.delete({ where: { id: String(req.params.id) } });
    res.json({ ok: true });
  }),
);

router.post(
  '/questions',
  asyncHandler(async (req, res) => {
    const { type, prompt, data, answer, explanation, skill, level, gameSlug, exerciseId } = req.body ?? {};
    if (!type || !prompt || answer === undefined || !explanation) throw badRequest('Missing question fields');
    const question = await prisma.question.create({
      data: {
        type,
        prompt: String(prompt),
        data: data ?? {},
        answer,
        explanation: String(explanation),
        skill: skill ?? 'GRAMMAR',
        level: level ?? 'BEGINNER',
        gameSlug: gameSlug ? String(gameSlug) : null,
        exerciseId: exerciseId ? String(exerciseId) : null,
      },
    });
    await audit(uid(req), 'QUESTION_CREATED', question.id, { gameSlug });
    res.status(201).json({ question });
  }),
);

router.delete(
  '/questions/:id',
  asyncHandler(async (req, res) => {
    await prisma.question.delete({ where: { id: String(req.params.id) } });
    res.json({ ok: true });
  }),
);

router.post(
  '/missions',
  asyncHandler(async (req, res) => {
    const { slug, title, description, period, metric, target, xpReward, coinReward, gameSlug } = req.body ?? {};
    if (!slug || !title || !metric || !target) throw badRequest('Missing mission fields');
    const mission = await prisma.mission.create({
      data: {
        slug: String(slug),
        title: String(title),
        description: String(description ?? title),
        period: period ?? 'DAILY',
        metric: String(metric),
        target: Number(target),
        xpReward: Number(xpReward ?? 20),
        coinReward: Number(coinReward ?? 30),
        gameSlug: gameSlug || null,
      },
    });
    res.status(201).json({ mission });
  }),
);

router.post(
  '/achievements',
  asyncHandler(async (req, res) => {
    const { slug, title, description, metric, threshold, xpReward, coinReward, category, rarity } = req.body ?? {};
    if (!slug || !title || !metric || !threshold) throw badRequest('Missing achievement fields');
    const achievement = await prisma.achievement.create({
      data: {
        slug: String(slug),
        title: String(title),
        description: String(description ?? title),
        metric: String(metric),
        threshold: Number(threshold),
        xpReward: Number(xpReward ?? 25),
        coinReward: Number(coinReward ?? 40),
        category: category ?? 'learning',
        rarity: rarity ?? 'RARE',
      },
    });
    res.status(201).json({ achievement });
  }),
);

router.post(
  '/cosmetics',
  validate(adminCosmeticSchema),
  asyncHandler(async (req, res) => {
    const item = await prisma.cosmeticItem.create({ data: req.body });
    res.status(201).json({ item });
  }),
);

/* ---------------------------- Announcements, Moderation, Certificates ---------------------------- */

router.post(
  '/announcements',
  asyncHandler(async (req, res) => {
    const title = String(req.body?.title ?? '').trim();
    const body = String(req.body?.body ?? '').trim();
    if (!title || !body) throw badRequest('Title and body are required');
    const announcement = await prisma.announcement.create({ data: { title, body, audience: String(req.body?.audience ?? 'ALL'), authorId: uid(req) } });
    await audit(uid(req), 'ANNOUNCEMENT_CREATED', announcement.id, { title });
    res.status(201).json({ announcement });
  }),
);

router.delete(
  '/announcements/:id',
  asyncHandler(async (req, res) => {
    await prisma.announcement.delete({ where: { id: String(req.params.id) } });
    res.json({ ok: true });
  }),
);

router.patch(
  '/reports/:id',
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const action = req.body?.action; // HIDE_POST | DISMISS
    const report = await prisma.contentReport.findUnique({ where: { id } });
    if (!report) throw notFound('Report');
    if (action === 'HIDE_POST') {
      await prisma.communityPost.update({ where: { id: report.postId }, data: { isHidden: true } });
      await prisma.contentReport.update({ where: { id }, data: { status: 'RESOLVED' } });
    } else {
      await prisma.contentReport.update({ where: { id }, data: { status: 'DISMISSED' } });
    }
    await audit(uid(req), 'REPORT_MODERATED', id, { action });
    res.json({ ok: true });
  }),
);

router.get(
  '/certificates',
  asyncHandler(async (_req, res) => {
    const certificates = await prisma.certificate.findMany({
      orderBy: { issuedAt: 'desc' },
      take: 100,
      include: { user: { select: { username: true, displayName: true, email: true } } },
    });
    res.json({ certificates });
  }),
);

router.patch(
  '/certificates/:id/revoke',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const cert = await prisma.certificate.update({ where: { id: String(req.params.id) }, data: { revoked: Boolean(req.body?.revoked ?? true) } });
    await audit(uid(req), 'CERTIFICATE_REVOKED', cert.id, { revoked: cert.revoked });
    res.json({ certificate: cert });
  }),
);

export default router;
