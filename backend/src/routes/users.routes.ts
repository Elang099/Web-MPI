import { Router } from 'express';
import { profileUpdateSchema, settingsUpdateSchema, type ProfileUpdateInput, type SettingsUpdateInput } from '@fec/shared';
import { prisma } from '../lib/prisma.js';
import { requireAuth, uid } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, notFound } from '../utils/errors.js';
import { loadUser, publicUser } from '../services/user.service.js';

const router = Router();
router.use(requireAuth);

/** PATCH /api/users/me/profile */
router.patch(
  '/me/profile',
  validate(profileUpdateSchema),
  asyncHandler(async (req, res) => {
    const { displayName, ...profile } = req.body as ProfileUpdateInput;
    const userId = uid(req);
    if (displayName) await prisma.user.update({ where: { id: userId }, data: { displayName } });
    if (Object.keys(profile).length) {
      await prisma.profile.upsert({ where: { userId }, update: profile, create: { userId, ...profile } });
    }
    res.json({ user: await loadUser(userId) });
  }),
);

/** GET /api/users/me/settings */
router.get(
  '/me/settings',
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const settings = await prisma.userSettings.upsert({ where: { userId }, update: {}, create: { userId } });
    res.json({ settings });
  }),
);

/** PATCH /api/users/me/settings */
router.patch(
  '/me/settings',
  validate(settingsUpdateSchema),
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const data = req.body as SettingsUpdateInput;
    const settings = await prisma.userSettings.upsert({ where: { userId }, update: data, create: { userId, ...data } });
    res.json({ settings });
  }),
);

/** DELETE /api/users/me — permanently delete own account (cascade). */
router.delete(
  '/me',
  asyncHandler(async (req, res) => {
    await prisma.user.delete({ where: { id: uid(req) } });
    res.clearCookie('fec_rt', { path: '/api/auth' });
    res.json({ ok: true });
  }),
);

/** GET /api/users/:username — privacy-aware public profile. */
router.get(
  '/:username',
  asyncHandler(async (req, res) => {
    const u = await prisma.user.findFirst({
      where: { username: { equals: String(req.params.username), mode: 'insensitive' } },
      include: { profile: true, stats: true, avatar: true, achievements: { include: { achievement: true }, orderBy: { earnedAt: 'desc' }, take: 12 } },
    });
    if (!u || !(u.profile?.isPublic ?? true)) throw notFound('Profile');
    res.json({
      user: {
        ...publicUser(u),
        bio: u.profile?.bio ?? null,
        cefr: u.profile?.cefr ?? null,
        level: u.stats?.level ?? 1,
        xp: u.stats?.xp ?? 0,
        streak: u.stats?.streak ?? 0,
        avatar: u.avatar,
        achievements: u.achievements.map((a) => ({ slug: a.achievement.slug, title: a.achievement.title, icon: a.achievement.icon, earnedAt: a.earnedAt })),
        memberSince: u.createdAt,
      },
    });
  }),
);

export default router;
