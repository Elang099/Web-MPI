import { Router } from 'express';
import { avatarUpdateSchema, purchaseItemSchema, type AvatarUpdateInput } from '@fec/shared';
import { prisma } from '../lib/prisma.js';
import { requireAuth, uid } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, badRequest, notFound } from '../utils/errors.js';
import { ensureStats } from '../services/reward.service.js';

const router = Router();
router.use(requireAuth);

/** GET /api/avatar — current avatar, catalog, inventory and coin balance */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const [avatar, catalog, owned, stats] = await Promise.all([
      prisma.avatar.upsert({ where: { userId }, update: {}, create: { userId } }),
      prisma.cosmeticItem.findMany({ orderBy: [{ type: 'asc' }, { unlockLevel: 'asc' }, { priceCoins: 'asc' }] }),
      prisma.inventoryItem.findMany({ where: { userId }, select: { itemId: true, source: true, acquiredAt: true } }),
      ensureStats(userId),
    ]);

    const ownedMap = new Map(owned.map((o) => [o.itemId, o]));
    res.json({
      avatar,
      coins: stats.coins,
      level: stats.level,
      items: catalog.map((item) => ({
        ...item,
        owned: ownedMap.has(item.id) || item.isDefault,
        acquiredAt: ownedMap.get(item.id)?.acquiredAt ?? null,
      })),
    });
  }),
);

/** PATCH /api/avatar — equip owned items & customize colors/expression */
router.patch(
  '/',
  validate(avatarUpdateSchema),
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const data = req.body as AvatarUpdateInput;

    // Verify ownership of any cosmetic slugs being equipped
    const slugs = [data.hairStyle, data.outfit, data.accessory, data.shoes, data.effect].filter((s): s is string => typeof s === 'string' && s.length > 0);
    if (slugs.length) {
      const items = await prisma.cosmeticItem.findMany({ where: { slug: { in: slugs } } });
      const owned = await prisma.inventoryItem.findMany({ where: { userId, itemId: { in: items.map((i) => i.id) } } });
      const ownedIds = new Set(owned.map((o) => o.itemId));
      for (const s of slugs) {
        const it = items.find((i) => i.slug === s);
        if (!it || (!it.isDefault && !ownedIds.has(it.id))) {
          throw badRequest(`You do not own "${s}" yet!`);
        }
      }
    }

    const avatar = await prisma.avatar.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
    res.json({ avatar });
  }),
);

/** POST /api/avatar/purchase — buy a cosmetic item with earned coins */
router.post(
  '/purchase',
  validate(purchaseItemSchema),
  asyncHandler(async (req, res) => {
    const userId = uid(req);
    const { itemSlug } = req.body as { itemSlug: string };
    const item = await prisma.cosmeticItem.findUnique({ where: { slug: itemSlug } });
    if (!item) throw notFound('Cosmetic item');
    if (item.achievementSlug) throw badRequest('This special cosmetic is unlocked by earning its achievement!');

    const already = await prisma.inventoryItem.findUnique({ where: { userId_itemId: { userId, itemId: item.id } } });
    if (already || item.isDefault) throw badRequest('You already own this item');

    const stats = await ensureStats(userId);
    if (stats.level < item.unlockLevel) throw badRequest(`Requires Level ${item.unlockLevel}`);
    if (stats.coins < item.priceCoins) throw badRequest('Not enough coins! Complete lessons or play games to earn more.');

    const updatedStats = await prisma.playerStats.update({
      where: { userId },
      data: { coins: { decrement: item.priceCoins } },
    });
    await prisma.xpTransaction.create({
      data: {
        userId,
        amount: 0,
        coins: -item.priceCoins,
        source: 'PURCHASE',
        sourceKey: `purchase:${item.slug}:${Date.now()}`,
        note: `Bought ${item.name}`,
      },
    });
    await prisma.inventoryItem.create({ data: { userId, itemId: item.id, source: 'purchase' } });

    res.json({ ok: true, item, coins: updatedStats.coins });
  }),
);

export default router;
