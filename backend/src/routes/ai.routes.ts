import { Router } from 'express';
import { aiChatSchema, type AiChatInput } from '@fec/shared';
import { prisma } from '../lib/prisma.js';
import { requireAuth, uid } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { asyncHandler, forbidden, notFound } from '../utils/errors.js';
import { generateTutorReply } from '../services/ai.service.js';
import { award } from '../services/reward.service.js';

const router = Router();
router.use(requireAuth);

/** GET /api/ai/conversations */
router.get(
  '/conversations',
  asyncHandler(async (req, res) => {
    const conversations = await prisma.aiConversation.findMany({
      where: { userId: uid(req) },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      include: { _count: { select: { messages: true } } },
    });
    res.json({ conversations });
  }),
);

/** GET /api/ai/conversations/:id */
router.get(
  '/conversations/:id',
  asyncHandler(async (req, res) => {
    const conv = await prisma.aiConversation.findUnique({
      where: { id: String(req.params.id) },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conv) throw notFound('Conversation');
    if (conv.userId !== uid(req)) throw forbidden();
    res.json({ conversation: conv });
  }),
);

/** DELETE /api/ai/conversations/:id */
router.delete(
  '/conversations/:id',
  asyncHandler(async (req, res) => {
    const conv = await prisma.aiConversation.findUnique({ where: { id: String(req.params.id) } });
    if (!conv) throw notFound('Conversation');
    if (conv.userId !== uid(req)) throw forbidden();
    await prisma.aiConversation.delete({ where: { id: conv.id } });
    res.json({ ok: true });
  }),
);

/** POST /api/ai/chat */
router.post(
  '/chat',
  aiLimiter,
  validate(aiChatSchema),
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const { conversationId, mode, message, context } = req.body as AiChatInput;

    let conv = conversationId
      ? await prisma.aiConversation.findUnique({
          where: { id: conversationId },
          include: { messages: { orderBy: { createdAt: 'desc' }, take: 12 } },
        })
      : null;

    if (conversationId && !conv) throw notFound('Conversation');
    if (conv && conv.userId !== userId) throw forbidden();

    if (!conv) {
      conv = await prisma.aiConversation.create({
        data: {
          userId,
          mode,
          title: message.slice(0, 48) + (message.length > 48 ? '…' : ''),
        },
        include: { messages: true },
      });
    }

    const history = [...conv.messages]
      .reverse()
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const { reply, provider } = await generateTutorReply({ userId, mode, message, context, history });

    const [userMsg, assistantMsg] = await Promise.all([
      prisma.aiMessage.create({ data: { conversationId: conv.id, role: 'user', content: message } }),
      prisma.aiMessage.create({ data: { conversationId: conv.id, role: 'assistant', content: reply } }),
    ]);

    await prisma.aiConversation.update({ where: { id: conv.id }, data: { mode, updatedAt: new Date() } });

    // Award a tiny once-per-day AI engagement progression (XP = 0 per message per XP_RULES, updates ai_messages metric for achievements)
    const day = new Date().toISOString().slice(0, 10);
    await award(userId, {
      source: 'AI',
      sourceKey: `ai:${day}:${conv.id}`,
      xp: 0,
      coins: 0,
      activity: { type: 'AI_TUTOR', title: `Practiced with AI Tutor (${mode})`, refId: conv.id, minutes: 1 },
      metrics: { ai_messages: 1 },
    });

    res.json({
      conversationId: conv.id,
      provider,
      messages: [userMsg, assistantMsg],
    });
  }),
);

export default router;
