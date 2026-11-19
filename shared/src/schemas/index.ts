import { z } from 'zod';
import { AUDIENCES, CEFR, GAME_SLUGS, COSMETIC_TYPES, ROLES, LEVELS, CATEGORIES } from '../constants';

/* --------------------------------- Auth --------------------------------- */

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  username: z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores'),
  displayName: z.string().trim().min(1).max(50),
  password: passwordSchema,
  audience: z.enum(AUDIENCES).default('GENERAL'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(254), // email or username
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email: z.string().trim().toLowerCase().email() });
export const resetPasswordSchema = z.object({ token: z.string().min(20).max(200), password: passwordSchema });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: passwordSchema });

/* ------------------------------ Profile/settings ------------------------------ */

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(50).optional(),
  bio: z.string().trim().max(280).optional(),
  audience: z.enum(AUDIENCES).optional(),
  cefr: z.enum(CEFR).optional(),
  goal: z.string().trim().max(120).optional(),
  careerField: z.string().trim().max(60).optional(),
  isPublic: z.boolean().optional(),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const settingsUpdateSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']).optional(),
  dailyGoalXp: z.number().int().min(10).max(500).optional(),
  soundVolume: z.number().min(0).max(1).optional(),
  musicVolume: z.number().min(0).max(1).optional(),
  muted: z.boolean().optional(),
  speechRate: z.number().min(0.5).max(1.5).optional(),
  voiceAccent: z.enum(['en-US', 'en-GB', 'en-AU']).optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  showOnLeaderboard: z.boolean().optional(),
  reducedMotion: z.boolean().optional(),
});
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;

/* --------------------------------- Avatar --------------------------------- */

export const avatarUpdateSchema = z.object({
  skinTone: z.string().max(16).optional(),
  hairStyle: z.string().max(48).optional(),
  hairColor: z.string().max(16).optional(),
  outfit: z.string().max(48).optional(),
  accessory: z.string().max(48).nullable().optional(),
  shoes: z.string().max(48).optional(),
  effect: z.string().max(48).nullable().optional(),
  expression: z.enum(['happy', 'cool', 'wink', 'determined', 'surprised']).optional(),
  name: z.string().trim().min(1).max(24).optional(),
});
export type AvatarUpdateInput = z.infer<typeof avatarUpdateSchema>;

export const purchaseItemSchema = z.object({ itemSlug: z.string().min(1).max(64) });

/* ---------------------------------- Games ---------------------------------- */

export const gameStartSchema = z.object({
  gameSlug: z.enum(GAME_SLUGS),
  mode: z.string().max(40).optional(), // e.g. puzzle type, adventure chapter, sim location
  level: z.enum(LEVELS).optional(),
});
export type GameStartInput = z.infer<typeof gameStartSchema>;

export const gameFinishSchema = z.object({
  score: z.number().int().min(0).max(10_000_000),
  distance: z.number().int().min(0).max(10_000_000).optional(),
  coinsCollected: z.number().int().min(0).max(100_000).optional(),
  answers: z
    .array(z.object({ questionId: z.string().min(1).max(64), response: z.union([z.string().max(300), z.array(z.string().max(200)).max(20)]) }))
    .max(200)
    .default([]),
  /** game-specific extra data (e.g. adventure checkpoint, sim scene id) */
  meta: z.record(z.union([z.string().max(200), z.number(), z.boolean()])).optional(),
});
export type GameFinishInput = z.infer<typeof gameFinishSchema>;

export const cityBuildSchema = z.object({
  buildingType: z.string().min(1).max(40),
  x: z.number().int().min(0).max(15),
  y: z.number().int().min(0).max(15),
});
export const cityUpgradeSchema = z.object({ buildingId: z.string().min(1).max(64) });
export const cityMoveSchema = z.object({ buildingId: z.string().min(1).max(64), x: z.number().int().min(0).max(15), y: z.number().int().min(0).max(15) });

/* ----------------------------------- AI ----------------------------------- */

export const aiChatSchema = z.object({
  conversationId: z.string().max(64).optional(),
  mode: z.enum(['tutor', 'grammar', 'vocabulary', 'writing', 'conversation', 'reading', 'pronunciation', 'explain']).default('tutor'),
  message: z.string().trim().min(1).max(4000),
  context: z.string().max(4000).optional(),
});
export type AiChatInput = z.infer<typeof aiChatSchema>;

/* ------------------------------- Community ------------------------------- */

export const postCreateSchema = z.object({
  content: z.string().trim().min(1).max(500),
  type: z.enum(['TEXT', 'MILESTONE']).default('TEXT'),
});
export const reportCreateSchema = z.object({ reason: z.string().trim().min(3).max(300) });

/* --------------------------------- Admin --------------------------------- */

export const adminUserUpdateSchema = z.object({
  role: z.enum(ROLES).optional(),
  isBanned: z.boolean().optional(),
});

export const adminLessonSchema = z.object({
  topicId: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(80),
  title: z.string().min(2).max(120),
  summary: z.string().max(400),
  level: z.enum(LEVELS),
  audiences: z.array(z.string()).default(['GENERAL']),
  durationMin: z.number().int().min(1).max(240),
  xpReward: z.number().int().min(0).max(500).default(20),
  emoji: z.string().max(8).optional(),
  order: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
  content: z.array(z.any()),
});

export const adminTopicSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).max(80),
  category: z.enum(CATEGORIES),
  title: z.string().min(2).max(120),
  description: z.string().max(400),
  order: z.number().int().min(0).default(0),
});

export const adminCosmeticSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).max(64),
  name: z.string().min(1).max(60),
  type: z.enum(COSMETIC_TYPES),
  rarity: z.enum(['COMMON', 'RARE', 'EPIC', 'LEGENDARY']),
  priceCoins: z.number().int().min(0).max(100000),
  unlockLevel: z.number().int().min(1).max(200).default(1),
  color: z.string().max(16).optional(),
});
