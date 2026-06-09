import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();
  
  // Custom helmet CSP settings to allow static assets and API calls on Render
  app.use(helmet({
    contentSecurityPolicy: false
  }));
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));
  app.use(rateLimit({ windowMs: 60_000, limit: 240 }));
  app.get('/health', (req, res) => res.json({ status: 'ok', app: 'The Reading Nook' }));
  app.use('/api', apiRouter);

  // Serve frontend built files statically
  const frontendDistPath = path.join(__dirname, '../../../frontend/dist');
  app.use(express.static(frontendDistPath));

  // Fallback for React Router single-page app paths
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

