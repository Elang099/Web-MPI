import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { forbidden, unauthorized } from '../utils/errors.js';

export interface AuthedUser {
  id: string;
  role: Role;
  username: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

interface AccessPayload {
  sub: string;
  role: Role;
}

export function signAccessToken(userId: string, role: Role): string {
  return jwt.sign({ sub: userId, role } satisfies AccessPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
  });
}

async function resolveUser(req: Request): Promise<AuthedUser | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  let payload: AccessPayload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] }) as AccessPayload;
  } catch {
    throw unauthorized('Invalid or expired token');
  }
  // Load from DB so role changes and bans take effect immediately.
  const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true, username: true, isBanned: true } });
  if (!user) throw unauthorized('Account no longer exists');
  if (user.isBanned) throw forbidden('This account has been suspended');
  return { id: user.id, role: user.role, username: user.username };
}

/** Requires a valid access token. Sets req.user. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const user = await resolveUser(req);
    if (!user) throw unauthorized();
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}

/** Attaches req.user if a valid token is present; never fails for anonymous requests. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    req.user = (await resolveUser(req)) ?? undefined;
  } catch {
    req.user = undefined;
  }
  next();
}

/** Role guard — use after requireAuth. */
export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };

/** Helper for handlers: returns the authenticated user id (throws if missing). */
export function uid(req: Request): string {
  if (!req.user) throw unauthorized();
  return req.user.id;
}
