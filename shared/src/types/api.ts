import type { Role, Audience, Cefr } from '../constants';

/** Standard error body returned by the API: { error: { code, message, details? } } */
export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: Role;
  createdAt: string;
  profile: {
    bio: string | null;
    audience: Audience;
    cefr: Cefr | null;
    goal: string | null;
    careerField: string | null;
    isPublic: boolean;
  } | null;
  stats: PlayerStatsDTO;
}

export interface PlayerStatsDTO {
  xp: number;
  level: number;
  coins: number;
  streak: number;
  longestStreak: number;
  lastActiveDay: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

/** Returned by any endpoint that grants rewards, so the UI can celebrate. */
export interface RewardSummary {
  xp: number;
  coins: number;
  leveledUp: boolean;
  newLevel: number;
  achievements: { slug: string; title: string; icon: string }[];
  items: { slug: string; name: string }[];
  duplicate?: boolean;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
