import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/config.js';
import { getDatabase } from './db/database.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

import chatRoutes from './routes/chatRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

// Ensure the database (and schema) exist before the server starts accepting traffic.
getDatabase();

const app = express();
const allowedOrigins = new Set([...config.corsOrigins, 'http://localhost:5173']);
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permit curl/server-to-server calls without an Origin header and allow only the exact configured frontend origins.
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

app.use(
  helmet({
    // Streaming SSE responses don't play well with a strict default CSP on
    // the API itself; the frontend (served separately) keeps its own CSP.
    contentSecurityPolicy: false,
  })
);
app.use(cors(corsOptions));
app.options('/api/:path*', cors(corsOptions));
app.use(
  compression({
    // The compression middleware buffers writes until its internal zlib
    // buffer fills, which defeats real-time token streaming. Skip it
    // entirely for the chat endpoints; everything else (JSON responses,
    // exports) still benefits from gzip.
    filter: (req, res) => {
      if (req.path.startsWith('/api/chat')) return false;
      return compression.filter(req, res);
    },
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(requestLogger);

app.use('/api/health', healthRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/settings', settingsRoutes);

// Lightweight root status endpoint to satisfy platform health checks
app.get('/', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
// Provide a default export for Vercel's Node runtime which expects a
// default export that is either a function or a server. An Express app
// is a callable handler (req, res) and satisfies that requirement.
export default app;

if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
  const server = app.listen(config.port, () => {
    logger.info(`Atlas AI backend listening on http://localhost:${config.port}`);
    logger.info(`Expecting Ollama at ${config.ollamaHost}`);
  });

  function shutdown(signal: string): void {
    logger.info(`Received ${signal}, shutting down.`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

  process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', reason);
});
