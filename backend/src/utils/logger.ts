import { config } from '../config/config.js';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 } as const;
type Level = keyof typeof LEVELS;

function shouldLog(level: Level): boolean {
  return LEVELS[level] <= LEVELS[config.logLevel];
}

function timestamp(): string {
  return new Date().toISOString();
}

function write(level: Level, message: string, meta?: unknown): void {
  if (!shouldLog(level)) return;
  const prefix = `[${timestamp()}] [${level.toUpperCase()}]`;
  if (meta !== undefined) {
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](prefix, message, meta);
  } else {
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](prefix, message);
  }
}

export const logger = {
  error: (message: string, meta?: unknown) => write('error', message, meta),
  warn: (message: string, meta?: unknown) => write('warn', message, meta),
  info: (message: string, meta?: unknown) => write('info', message, meta),
  debug: (message: string, meta?: unknown) => write('debug', message, meta),
};
