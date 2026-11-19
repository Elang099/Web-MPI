/**
 * Platform-wide constants shared by the backend and the frontend.
 */

export const ROLES = ['STUDENT', 'TEACHER', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
export type Level = (typeof LEVELS)[number];

export const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type Cefr = (typeof CEFR)[number];

export const AUDIENCES = ['SMP', 'SMA', 'SMK', 'GENERAL'] as const;
export type Audience = (typeof AUDIENCES)[number];

export const SKILLS = ['VOCABULARY', 'GRAMMAR', 'READING', 'WRITING', 'LISTENING', 'SPEAKING', 'PRONUNCIATION'] as const;
export type Skill = (typeof SKILLS)[number];

export const CATEGORIES = [
  'GRAMMAR',
  'VOCABULARY',
  'READING',
  'WRITING',
  'LISTENING',
  'SPEAKING',
  'PRONUNCIATION',
  'TEXT_TYPES',
  'VOCATIONAL',
] as const;
export type Category = (typeof CATEGORIES)[number];

/** Visual metadata for each learning category (used by the UI). */
export const CATEGORY_META: Record<Category, { label: string; color: string; icon: string; skill: Skill; blurb: string }> = {
  GRAMMAR: { label: 'Grammar', color: '#7C5CFF', icon: 'Braces', skill: 'GRAMMAR', blurb: 'Build sentences that work — from parts of speech to conditionals.' },
  VOCABULARY: { label: 'Vocabulary', color: '#00D1FF', icon: 'BookA', skill: 'VOCABULARY', blurb: 'Words for school, work, travel, tech and everyday life.' },
  READING: { label: 'Reading', color: '#22C55E', icon: 'BookOpen', skill: 'READING', blurb: 'Find main ideas, details and hidden meanings in real texts.' },
  WRITING: { label: 'Writing', color: '#F59E0B', icon: 'PenLine', skill: 'WRITING', blurb: 'From sentences to essays and professional emails.' },
  LISTENING: { label: 'Listening', color: '#EC4899', icon: 'Headphones', skill: 'LISTENING', blurb: 'Train your ear with dialogues, announcements and interviews.' },
  SPEAKING: { label: 'Speaking', color: '#F97316', icon: 'Mic', skill: 'SPEAKING', blurb: 'Speak with confidence in daily life, interviews and presentations.' },
  PRONUNCIATION: { label: 'Pronunciation', color: '#14B8A6', icon: 'AudioLines', skill: 'PRONUNCIATION', blurb: 'Sounds, stress and intonation that make you clear.' },
  TEXT_TYPES: { label: 'Text Types', color: '#6366F1', icon: 'Files', skill: 'READING', blurb: 'Descriptive, narrative, report, exposition and more (SMP · SMA · SMK).' },
  VOCATIONAL: { label: 'Vocational English', color: '#0EA5E9', icon: 'Briefcase', skill: 'SPEAKING', blurb: 'English for the workplace, hospitality, customer service and tech.' },
};

export const GAME_SLUGS = ['english-dash', 'english-adventure', 'city-builder', 'word-puzzle', 'life-simulator'] as const;
export type GameSlug = (typeof GAME_SLUGS)[number];

export const GAME_META: Record<GameSlug, { title: string; tagline: string; color: string; skills: Skill[] }> = {
  'english-dash': { title: 'English Dash', tagline: 'Run, dodge and pick the right word gate!', color: '#FF4D8D', skills: ['VOCABULARY', 'GRAMMAR'] },
  'english-adventure': { title: 'English Adventure', tagline: 'Explore lands, read clues, unlock doors.', color: '#22C55E', skills: ['READING', 'GRAMMAR', 'VOCABULARY'] },
  'city-builder': { title: 'English City Builder', tagline: 'Learn English, build your dream city.', color: '#F59E0B', skills: ['VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING', 'WRITING', 'SPEAKING'] },
  'word-puzzle': { title: 'Word Puzzle Quest', tagline: 'Scrambles, searches, idioms and more.', color: '#7C5CFF', skills: ['VOCABULARY', 'GRAMMAR'] },
  'life-simulator': { title: 'English Life Simulator', tagline: 'Talk your way through real-life places.', color: '#00D1FF', skills: ['SPEAKING', 'LISTENING'] },
};

export const COSMETIC_TYPES = ['HAIR', 'OUTFIT', 'ACCESSORY', 'SHOES', 'SKIN', 'EFFECT'] as const;
export type CosmeticType = (typeof COSMETIC_TYPES)[number];

export const RARITIES = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const;
export type Rarity = (typeof RARITIES)[number];

/** XP economy (server is the source of truth; values shared for display). */
export const XP_RULES = {
  lessonComplete: 20,
  exercisePerfectBonus: 10,
  exerciseCorrect: 2,
  assessmentPass: 50,
  dailyGoalDefault: 50,
  gameMaxXpPerSession: 120,
  gameDailyXpCap: 600,
  gameMaxCoinsPerSession: 300,
  aiTutorMessage: 0,
} as const;

/** Total XP required to *reach* a level. Level 1 = 0 XP, Level 2 = 100, Level 3 = 300, Level 4 = 600 ... */
export function xpForLevel(level: number): number {
  return 50 * level * (level - 1);
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, current: xp - base, required: next - base, percent: Math.round(((xp - base) / (next - base)) * 100) };
}

/** CEFR estimate from a placement percentage. */
export function cefrFromPercent(percent: number): Cefr {
  if (percent >= 90) return 'C2';
  if (percent >= 78) return 'C1';
  if (percent >= 64) return 'B2';
  if (percent >= 48) return 'B1';
  if (percent >= 30) return 'A2';
  return 'A1';
}

/** ISO week key, e.g. 2026-W47 (used for weekly missions/leaderboards). */
export function weekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Day key, e.g. 2026-11-19 (local date of the server). */
export function dayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
