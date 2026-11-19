import { Router, type Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type LoginInput,
  type RegisterInput,
} from '@fec/shared';
import { prisma } from '../lib/prisma.js';
import { env, isProd } from '../config/env.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { requireAuth, signAccessToken, uid } from '../middleware/auth.js';
import { AppError, asyncHandler, unauthorized } from '../utils/errors.js';
import { randomToken, sha256 } from '../utils/crypto.js';
import { loadUser } from '../services/user.service.js';
import { touchStreak } from '../services/reward.service.js';

const router = Router();
const REFRESH_COOKIE = 'fec_rt';
const BCRYPT_ROUNDS = 12;

const DEFAULT_ITEMS = ['hair-short', 'outfit-hoodie-cyan', 'shoes-sneakers'];

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  });
}

async function issueSession(res: Response, userId: string, role: Parameters<typeof signAccessToken>[1], userAgent?: string) {
  const refresh = randomToken();
  await prisma.authSession.create({
    data: {
      userId,
      tokenHash: sha256(refresh),
      userAgent: userAgent?.slice(0, 200),
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 86400_000),
    },
  });
  setRefreshCookie(res, refresh);
  return signAccessToken(userId, role);
}

/** POST /api/auth/register */
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as RegisterInput;
    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: body.email }, { username: { equals: body.username, mode: 'insensitive' } }] },
      select: { email: true },
    });
    if (exists) throw new AppError(409, 'ACCOUNT_EXISTS', exists.email === body.email ? 'Email is already registered' : 'Username is taken');

    const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
    const defaults = await prisma.cosmeticItem.findMany({ where: { OR: [{ isDefault: true }, { slug: { in: DEFAULT_ITEMS } }] } });
    const user = await prisma.user.create({
      data: {
        email: body.email,
        username: body.username,
        displayName: body.displayName,
        passwordHash,
        profile: { create: { audience: body.audience } },
        settings: { create: {} },
        stats: { create: {} },
        avatar: { create: { name: body.displayName.split(' ')[0].slice(0, 24) } },
        cityState: { create: {} },
        inventory: { create: defaults.map((d) => ({ itemId: d.id, source: 'default' })) },
        notifications: {
          create: {
            type: 'SYSTEM',
            title: 'Welcome to FUTURE ENGLISH CENTER! 👋',
            body: 'Take the placement test to personalise your learning path.',
            link: '/assessments',
          },
        },
      },
    });
    const accessToken = await issueSession(res, user.id, user.role, req.headers['user-agent']);
    res.status(201).json({ accessToken, user: await loadUser(user.id) });
  }),
);

/** POST /api/auth/login */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { identifier, password } = req.body as LoginInput;
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier.toLowerCase() }, { username: { equals: identifier, mode: 'insensitive' } }] },
    });
    // Always run bcrypt to keep timing similar for unknown users.
    const ok = await bcrypt.compare(password, user?.passwordHash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva');
    if (!user || !ok) throw new AppError(401, 'INVALID_CREDENTIALS', 'Incorrect email/username or password');
    if (user.isBanned) throw new AppError(403, 'SUSPENDED', 'This account has been suspended');
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await touchStreak(user.id).catch(() => undefined);
    const accessToken = await issueSession(res, user.id, user.role, req.headers['user-agent']);
    res.json({ accessToken, user: await loadUser(user.id) });
  }),
);

/** POST /api/auth/refresh — rotates the refresh token (httpOnly cookie). */
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) throw unauthorized('No session');
    const session = await prisma.authSession.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      // Reuse of a revoked token → revoke all sessions for this user (token theft protection).
      if (session?.revokedAt) await prisma.authSession.updateMany({ where: { userId: session.userId, revokedAt: null }, data: { revokedAt: new Date() } });
      res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
      throw unauthorized('Session expired');
    }
    if (session.user.isBanned) throw new AppError(403, 'SUSPENDED', 'This account has been suspended');
    await prisma.authSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    const accessToken = await issueSession(res, session.userId, session.user.role, req.headers['user-agent']);
    res.json({ accessToken, user: await loadUser(session.userId) });
  }),
);

/** POST /api/auth/logout */
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (token) await prisma.authSession.updateMany({ where: { tokenHash: sha256(token), revokedAt: null }, data: { revokedAt: new Date() } });
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    res.json({ ok: true });
  }),
);

/** GET /api/auth/me */
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: await loadUser(uid(req)) });
  }),
);

/** POST /api/auth/forgot-password — always responds 200 to avoid account enumeration. */
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body as { email: string };
    const user = await prisma.user.findUnique({ where: { email } });
    let devResetUrl: string | undefined;
    if (user) {
      const token = randomToken(32);
      await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 30 * 60_000) } });
      const url = `${env.CLIENT_ORIGIN}/reset-password?token=${token}`;
      // In production, send via an email provider here. In development the link is logged/returned.
      console.info(`[auth] password reset link for ${email}: ${url}`);
      if (!isProd) devResetUrl = url;
    }
    res.json({ ok: true, message: 'If that email exists, a reset link has been sent.', devResetUrl });
  }),
);

/** POST /api/auth/reset-password */
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const { token, password } = req.body as { token: string; password: string };
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) } });
    if (!record || record.usedAt || record.expiresAt < new Date()) throw new AppError(400, 'INVALID_TOKEN', 'Reset link is invalid or has expired');
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await prisma.user.update({ where: { id: record.userId }, data: { passwordHash } });
    await prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    await prisma.authSession.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } });
    res.json({ ok: true });
  }),
);

/** POST /api/auth/change-password */
router.post(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    const user = await prisma.user.findUniqueOrThrow({ where: { id: uid(req) } });
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) throw new AppError(400, 'WRONG_PASSWORD', 'Current password is incorrect');
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS) } });
    res.json({ ok: true });
  }),
);

export default router;
