import type { AuthResponse, AuthUser, PublicQuestion, RewardSummary } from '@fec/shared';

const USERS_KEY = 'fec_offline_users_v1';
const SESSION_KEY = 'fec_offline_session_v1';
const AVATAR_KEY = 'fec_offline_avatar_v1';
const SCORES_KEY = 'fec_offline_scores_v1';

interface StoredUser {
  password: string;
  user: AuthUser;
}

const DEFAULT_DEMO_USERS: StoredUser[] = [
  {
    password: 'Password123!',
    user: {
      id: 'demo-student-id',
      email: 'student@futureenglish.test',
      username: 'alex_learner',
      displayName: 'Alex Learner',
      role: 'STUDENT',
      createdAt: '2025-01-01T00:00:00.000Z',
      profile: {
        bio: 'Learning English with Future English Center!',
        audience: 'GENERAL',
        cefr: 'B1',
        goal: 'Fluent daily & career English',
        careerField: 'Technology',
        isPublic: true,
      },
      stats: { xp: 1250, level: 4, coins: 640, streak: 7, longestStreak: 12, lastActiveDay: new Date().toISOString().slice(0, 10) },
    },
  },
  {
    password: 'Password123!',
    user: {
      id: 'demo-teacher-id',
      email: 'teacher@futureenglish.test',
      username: 'ms_claire',
      displayName: 'Ms. Claire',
      role: 'TEACHER',
      createdAt: '2025-01-01T00:00:00.000Z',
      profile: {
        bio: 'English Instructor & Curriculum Mentor.',
        audience: 'GENERAL',
        cefr: 'C2',
        goal: 'Help students master English',
        careerField: 'Education',
        isPublic: true,
      },
      stats: { xp: 4200, level: 9, coins: 1500, streak: 21, longestStreak: 30, lastActiveDay: new Date().toISOString().slice(0, 10) },
    },
  },
  {
    password: 'Password123!',
    user: {
      id: 'demo-admin-id',
      email: 'admin@futureenglish.test',
      username: 'admin_fec',
      displayName: 'Platform Admin',
      role: 'ADMIN',
      createdAt: '2025-01-01T00:00:00.000Z',
      profile: {
        bio: 'FUTURE ENGLISH CENTER Administrator.',
        audience: 'GENERAL',
        cefr: 'C2',
        goal: 'Manage platform',
        careerField: 'Management',
        isPublic: true,
      },
      stats: { xp: 9999, level: 15, coins: 5000, streak: 45, longestStreak: 45, lastActiveDay: new Date().toISOString().slice(0, 10) },
    },
  },
];

const OFFLINE_QUESTIONS: PublicQuestion[] = [
  {
    id: 'off-q1',
    type: 'MCQ',
    prompt: 'Pick the right preposition: "Class starts ___ 8 AM."',
    skill: 'GRAMMAR',
    data: { options: ['on', 'in', 'at'] },
  },
  {
    id: 'off-q2',
    type: 'MCQ',
    prompt: 'Complete: "She ___ in Surabaya since 2021."',
    skill: 'GRAMMAR',
    data: { options: ['lives', 'has lived', 'was live'] },
  },
  {
    id: 'off-q3',
    type: 'MCQ',
    prompt: 'Choose the synonym of "resilient":',
    skill: 'VOCABULARY',
    data: { options: ['adaptable', 'fragile', 'careless'] },
  },
  {
    id: 'off-q4',
    type: 'MCQ',
    prompt: 'Join the contrast: "I wanted to call you, ___ my battery died."',
    skill: 'GRAMMAR',
    data: { options: ['but', 'because', 'so'] },
  },
  {
    id: 'off-q5',
    type: 'MCQ',
    prompt: 'Which is polite for a formal email?',
    skill: 'WRITING',
    data: { options: ['I am writing to inquire', 'Hey give me info', 'Tell me now'] },
  },
  {
    id: 'off-q6',
    type: 'MCQ',
    prompt: 'Choose the correct past tense: "Yesterday we ___ to the museum."',
    skill: 'GRAMMAR',
    data: { options: ['went', 'go', 'gone'] },
  },
  {
    id: 'off-q7',
    type: 'MCQ',
    prompt: 'What does "break a leg" mean?',
    skill: 'VOCABULARY',
    data: { options: ['Good luck!', 'Get injured', 'Run fast'] },
  },
  {
    id: 'off-q8',
    type: 'MCQ',
    prompt: 'Pick the right article: "He is ___ honest engineer."',
    skill: 'GRAMMAR',
    data: { options: ['an', 'a', 'the'] },
  },
];

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredUser[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_DEMO_USERS;
}

function saveStoredUsers(users: StoredUser[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    /* ignore */
  }
}

export function getOfflineSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setOfflineSession(user: AuthUser | null) {
  try {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function getOfflineAvatar() {
  try {
    const raw = localStorage.getItem(AVATAR_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {
    skinTone: '#F1C27D',
    hairStyle: 'hair-short',
    hairColor: '#1E293B',
    outfit: 'outfit-hoodie-cyan',
    accessory: 'none',
    shoes: 'shoes-sneakers',
    effect: 'none',
    expression: 'smile',
    name: 'Explorer',
  };
}

function getOfflineScores(): Record<string, number> {
  try {
    const raw = localStorage.getItem(SCORES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export class OfflineAuthError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function handleOfflineRequest<T>(method: string, path: string, body?: unknown): T {
  const users = getStoredUsers();
  const activeUser = getOfflineSession() ?? DEFAULT_DEMO_USERS[0].user;

  // Auth: Login
  if (method === 'POST' && path === '/auth/login') {
    const { identifier, password } = (body ?? {}) as { identifier?: string; password?: string };
    const idLower = (identifier ?? '').trim().toLowerCase();
    const match = users.find(
      (u) => u.user.email.toLowerCase() === idLower || u.user.username.toLowerCase() === idLower,
    );
    if (!match || match.password !== password) {
      throw new OfflineAuthError(401, 'INVALID_CREDENTIALS', 'Incorrect email/username or password');
    }
    setOfflineSession(match.user);
    const res: AuthResponse = { accessToken: 'offline-demo-token', user: match.user };
    return res as T;
  }

  // Auth: Register
  if (method === 'POST' && path === '/auth/register') {
    const data = (body ?? {}) as { email: string; username: string; displayName: string; password: string; audience?: 'SMP' | 'SMA' | 'SMK' | 'GENERAL' };
    const emailLower = data.email.trim().toLowerCase();
    const userLower = data.username.trim().toLowerCase();
    if (users.some((u) => u.user.email.toLowerCase() === emailLower)) {
      throw new OfflineAuthError(409, 'ACCOUNT_EXISTS', 'Email is already registered');
    }
    if (users.some((u) => u.user.username.toLowerCase() === userLower)) {
      throw new OfflineAuthError(409, 'ACCOUNT_EXISTS', 'Username is taken');
    }
    const newUser: AuthUser = {
      id: `local-${Date.now()}`,
      email: emailLower,
      username: data.username.trim(),
      displayName: data.displayName.trim(),
      role: 'STUDENT',
      createdAt: new Date().toISOString(),
      profile: {
        bio: 'New learner at FUTURE ENGLISH CENTER!',
        audience: data.audience ?? 'GENERAL',
        cefr: 'A2',
        goal: 'Master English step by step',
        careerField: null,
        isPublic: true,
      },
      stats: { xp: 50, level: 1, coins: 100, streak: 1, longestStreak: 1, lastActiveDay: new Date().toISOString().slice(0, 10) },
    };
    saveStoredUsers([...users, { password: data.password, user: newUser }]);
    setOfflineSession(newUser);
    const res: AuthResponse = { accessToken: 'offline-demo-token', user: newUser };
    return res as T;
  }

  // Auth: Logout
  if (method === 'POST' && path === '/auth/logout') {
    setOfflineSession(null);
    return { ok: true } as T;
  }

  // User settings / profile
  if (path === '/users/me/settings') {
    return { settings: { theme: 'dark', soundEnabled: true, reducedMotion: false } } as T;
  }
  if (path === '/users/me') {
    return { user: activeUser } as T;
  }

  // Avatar
  if (path === '/avatar') {
    if (method === 'PATCH' || method === 'PUT') {
      const merged = { ...getOfflineAvatar(), ...(body as Record<string, unknown>) };
      localStorage.setItem(AVATAR_KEY, JSON.stringify(merged));
      return { avatar: merged } as T;
    }
    return { avatar: getOfflineAvatar(), inventory: [] } as T;
  }

  // Dashboard
  if (path === '/progress/dashboard') {
    return {
      user: { displayName: activeUser.displayName, profile: activeUser.profile },
      dailyGoal: { current: 35, target: 50, percent: 70 },
      levelProgress: { level: activeUser.stats.level, current: activeUser.stats.xp % 500, required: 500, percent: Math.round(((activeUser.stats.xp % 500) / 500) * 100) },
      stats: { ...activeUser.stats, lessonsCompleted: 6, lessonsTotal: 42 },
      continueLesson: { slug: 'simple-present', title: 'Simple Present & Daily Routines', summary: 'Master everyday habits, facts, and subject-verb agreement.', level: 'A1', durationMin: 10, emoji: '⚡', topic: { title: 'Simple Present', category: 'GRAMMAR' } },
      recommendedLessons: [
        { id: 'rec-1', slug: 'present-perfect', title: 'Present Perfect vs Simple Past', summary: 'Connect past actions to the present moment.', level: 'B1', durationMin: 12, xpReward: 60, emoji: '✨', topic: { title: 'Tenses', category: 'GRAMMAR' } },
        { id: 'rec-2', slug: 'workplace-vocab', title: 'Workplace & Tech Vocabulary', summary: 'Essential vocabulary for modern meetings and tech teams.', level: 'B1', durationMin: 10, xpReward: 50, emoji: '💼', topic: { title: 'Workplace', category: 'VOCABULARY' } },
      ],
      weakestSkills: [{ skill: 'WRITING', accuracy: 74, attempts: 12 }],
      skills: [
        { skill: 'GRAMMAR', accuracy: 88, attempts: 32, activities: 8 },
        { skill: 'VOCABULARY', accuracy: 91, attempts: 28, activities: 7 },
        { skill: 'READING', accuracy: 82, attempts: 16, activities: 4 },
        { skill: 'LISTENING', accuracy: 85, attempts: 14, activities: 4 },
      ],
      weekly: [
        { date: 'Mon', label: 'Mon', xp: 40 },
        { date: 'Tue', label: 'Tue', xp: 65 },
        { date: 'Wed', label: 'Wed', xp: 50 },
        { date: 'Thu', label: 'Thu', xp: 80 },
        { date: 'Fri', label: 'Fri', xp: 95 },
        { date: 'Sat', label: 'Sat', xp: 60 },
        { date: 'Sun', label: 'Sun', xp: 75 },
      ],
      recentActivities: [
        { id: 'act-1', type: 'GAME', title: 'Played English Dash 3D', xp: 80, createdAt: new Date().toISOString() },
      ],
      missions: [
        { id: 'm1', title: 'Play English Dash 3D', description: 'Complete 1 run in English Dash 3D', period: 'DAILY', progress: 1, target: 1, completed: true, claimed: false, xpReward: 50, coinReward: 30 },
      ],
      paths: [
        { id: 'p1', slug: 'general-fluency', title: 'Everyday Fluency Track', level: 'A1-B2', color: '#00D1FF', enrolled: true, completedSteps: 3, totalSteps: 10, percent: 30 },
      ],
      achievements: { earnedCount: 3, totalCount: 15, recent: [{ slug: 'first-steps', title: 'First Steps', description: 'Started learning on Future English Center', rarity: 'COMMON' }] },
      challenges: [{ id: 'c1', title: '7-Day Streak Sprint', description: 'Practice every day for 7 days', target: 7, xpReward: 150 }],
    } as T;
  }

  // Games Hub
  if (path === '/games/hub') {
    const scores = getOfflineScores();
    return {
      progress: [
        { gameSlug: 'english-dash', highScore: scores['english-dash'] ?? 0, bestDistance: 0, totalPlays: 1, totalCorrect: 0, level: 1 },
        { gameSlug: 'english-adventure', highScore: scores['english-adventure'] ?? 0, bestDistance: 0, totalPlays: 0, totalCorrect: 0, level: 1, data: { unlockedChapter: 1 } },
        { gameSlug: 'city-builder', highScore: scores['city-builder'] ?? 0, bestDistance: 0, totalPlays: 0, totalCorrect: 0, level: 1 },
        { gameSlug: 'word-puzzle', highScore: scores['word-puzzle'] ?? 0, bestDistance: 0, totalPlays: 0, totalCorrect: 0, level: 1 },
        { gameSlug: 'life-simulator', highScore: scores['life-simulator'] ?? 0, bestDistance: 0, totalPlays: 0, totalCorrect: 0, level: 1 },
      ],
      avatar: getOfflineAvatar(),
      city: { name: 'Future Metropolis', population: 120, bricks: 40, wood: 35, books: 25 },
      missions: [],
    } as T;
  }

  // Game session start
  if (method === 'POST' && path === '/games/sessions/start') {
    return {
      sessionId: `offline-session-${Date.now()}`,
      questions: OFFLINE_QUESTIONS,
    } as T;
  }

  // Game session finish
  if (method === 'POST' && path.startsWith('/games/sessions/') && path.endsWith('/finish')) {
    const payload = (body ?? {}) as { score?: number; coinsCollected?: number };
    const earnedXp = Math.max(25, Math.round((payload.score ?? 100) / 10));
    const earnedCoins = Math.max(10, payload.coinsCollected ?? 15);
    const reward: RewardSummary = {
      xp: earnedXp,
      coins: earnedCoins,
      leveledUp: false,
      newLevel: activeUser.stats.level,
      achievements: [],
      items: [],
    };
    return {
      score: payload.score ?? 100,
      accuracy: 85,
      reward,
    } as T;
  }

  // Notifications
  if (path.startsWith('/notifications')) {
    return { notifications: [], unreadCount: 0 } as T;
  }

  return {} as T;
}
