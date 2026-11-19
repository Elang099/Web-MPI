import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { optionalAuth, requireAuth, uid } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();

/** GET /api/notifications/announcements — public published announcements */
router.get(
  '/announcements',
  optionalAuth,
  asyncHandler(async (_req, res) => {
    const announcements = await prisma.announcement.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { author: { select: { displayName: true } } },
    });
    res.json({ announcements });
  }),
);

/** GET /api/notifications — user notifications + unread count */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const [notifications, unreadCount, announcements] = await Promise.all([
      prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.notification.count({ where: { userId, readAt: null } }),
      prisma.announcement.findMany({ where: { isPublished: true }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);
    res.json({ notifications, unreadCount, announcements });
  }),
);

/** POST /api/notifications/read-all */
router.post(
  '/read-all',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({ where: { userId: uid(req), readAt: null }, data: { readAt: new Date() } });
    res.json({ ok: true });
  }),
);

/** POST /api/notifications/:id/read */
router.post(
  '/:id/read',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({ where: { id: String(req.params.id), userId: uid(req) }, data: { readAt: new Date() } });
    res.json({ ok: true });
  }),
);

export default router;
