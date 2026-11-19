import rateLimit from 'express-rate-limit';
import { isTest } from '../config/env.js';

const json = (message: string) => ({ error: { code: 'RATE_LIMITED', message } });
const skip = () => isTest;

/** General API limiter. */
export const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: json('Too many requests, please slow down.'),
  skip,
});

/** Login / register / password reset. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: json('Too many attempts. Please try again in a few minutes.'),
  skip,
});

/** AI tutor (protects the paid upstream API). */
export const aiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: json('The tutor needs a short break. Try again in a minute.'),
  skip,
});

/** Game session start/finish. */
export const gameLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: json('Too many game requests.'),
  skip,
});
