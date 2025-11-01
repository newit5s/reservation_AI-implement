import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './env';
import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS } from '../utils/constants';
import { errorHandler } from '../middleware/error.middleware';

export const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    })
  );
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(
    rateLimit({
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  if (env.NODE_ENV !== 'test') {
    // Lazy-load swagger only outside test to avoid ESM/transform overhead in Jest
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const swaggerUi = require('swagger-ui-express');
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const { swaggerSpec } = require('./swagger');
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }
  if (env.NODE_ENV === 'test') {
    // Mount only lightweight health routes to avoid importing heavy modules
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const healthRouter = require('../routes/health.routes').default;
    app.use('/api/health', healthRouter);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const { routes } = require('../routes');
    app.use('/api', routes);
  }

  app.use(errorHandler);

  return app;
};
