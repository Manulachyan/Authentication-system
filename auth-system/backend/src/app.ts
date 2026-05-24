import express, {
  Request,
  Response,
  NextFunction,
} from 'express';

import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from 'passport';

import { ENV } from './config/env';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import sessionRoutes from './routes/session.routes';

import './services/passport.service';

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '10kb' }));

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());

// Logging
if (ENV.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Passport
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);

app.use('/api/user', userRoutes);

app.use('/api/sessions', sessionRoutes);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    message: 'Route not found',
  });
});

// Global error handler
app.use(
  (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error(err.stack);

    res.status(500).json({
      message: 'Internal server error',
    });
  }
);

export default app;