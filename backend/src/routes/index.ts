import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import learningRoutes from './learning.routes.js';
import progressRoutes from './progress.routes.js';
import gamesRoutes from './games.routes.js';
import avatarRoutes from './avatar.routes.js';
import aiRoutes from './ai.routes.js';
import assessmentRoutes from './assessment.routes.js';
import communityRoutes from './community.routes.js';
import notificationRoutes from './notification.routes.js';
import adminRoutes from './admin.routes.js';

/**
 * Route registry. Each feature module owns its own router file:
 *   /api/auth           auth.routes.ts          register/login/refresh/logout/reset
 *   /api/users          users.routes.ts         profile, settings, public profiles
 *   /api/learning       learning.routes.ts      topics, lessons, exercises, paths, vocabulary
 *   /api/progress       progress.routes.ts      dashboard, analytics, missions, achievements, recommendations
 *   /api/games          games.routes.ts         game sessions, questions, progress, city builder
 *   /api/avatar         avatar.routes.ts        avatar, cosmetics shop, inventory
 *   /api/ai             ai.routes.ts            AI tutor
 *   /api/assessments    assessment.routes.ts    tests, career reports, certificates, PDF reports
 *   /api/community      community.routes.ts     leaderboard, challenges, posts, moderation reports
 *   /api/notifications  notification.routes.ts  notifications + announcements
 *   /api/admin          admin.routes.ts         admin/teacher management
 */
export const api = Router();

api.get('/health', (_req, res) => res.json({ ok: true, service: 'future-english-center', time: new Date().toISOString() }));
api.use('/auth', authRoutes);
api.use('/users', usersRoutes);
api.use('/learning', learningRoutes);
api.use('/progress', progressRoutes);
api.use('/games', gamesRoutes);
api.use('/avatar', avatarRoutes);
api.use('/ai', aiRoutes);
api.use('/assessments', assessmentRoutes);
api.use('/community', communityRoutes);
api.use('/notifications', notificationRoutes);
api.use('/admin', adminRoutes);
