import type { Prisma } from '@prisma/client';
import type { AuthUser } from '@fec/shared';
import { prisma } from '../lib/prisma.js';

export const userInclude = { profile: true, stats: true } satisfies Prisma.UserInclude;
type UserWithRelations = Prisma.UserGetPayload<{ include: typeof userInclude }>;

/** Safe user DTO — never includes passwordHash or other secrets. */
export function serializeUser(u: UserWithRelations): AuthUser {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    profile: u.profile
      ? {
          bio: u.profile.bio,
          audience: u.profile.audience as NonNullable<AuthUser['profile']>['audience'],
          cefr: (u.profile.cefr as NonNullable<AuthUser['profile']>['cefr']) ?? null,
          goal: u.profile.goal,
          careerField: u.profile.careerField,
          isPublic: u.profile.isPublic,
        }
      : null,
    stats: {
      xp: u.stats?.xp ?? 0,
      level: u.stats?.level ?? 1,
      coins: u.stats?.coins ?? 0,
      streak: u.stats?.streak ?? 0,
      longestStreak: u.stats?.longestStreak ?? 0,
      lastActiveDay: u.stats?.lastActiveDay ?? null,
    },
  };
}

export async function loadUser(id: string) {
  const u = await prisma.user.findUnique({ where: { id }, include: userInclude });
  return u ? serializeUser(u) : null;
}

/** Public, privacy-safe view of another user (no email, respects isPublic). */
export function publicUser(u: { id: string; username: string; displayName: string; profile?: { isPublic: boolean } | null }) {
  const isPublic = u.profile?.isPublic ?? true;
  return { id: u.id, username: isPublic ? u.username : 'hidden', displayName: isPublic ? u.displayName : 'Anonymous learner' };
}
