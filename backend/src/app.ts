import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { env, isProd, isTest } from './config/env.js';
import { api } from './routes/index.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
              fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
              imgSrc: ["'self'", 'data:', 'blob:'],
              mediaSrc: ["'self'", 'data:', 'blob:'],
              connectSrc: ["'self'"],
              workerSrc: ["'self'", 'blob:'],
            },
          }
        : false,
    }),
  );
  app.use(cors({ origin: env.CLIENT_ORIGIN.split(','), credentials: true }));
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());
  if (!isTest) app.use(morgan(isProd ? 'combined' : 'dev'));

  app.use('/api', apiLimiter, api);
  app.use('/api', notFoundHandler);

  // In production, serve the built frontend (single-origin deployment).
  const here = path.dirname(fileURLToPath(import.meta.url));
  const webDist = path.resolve(here, '../../frontend/dist');
  if (isProd && fs.existsSync(webDist)) {
    app.use(express.static(webDist, { maxAge: '7d', index: false }));
    app.get('*', (_req, res) => res.sendFile(path.join(webDist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
