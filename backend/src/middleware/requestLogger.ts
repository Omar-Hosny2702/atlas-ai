import morgan from 'morgan';
import { logger } from '../utils/logger.js';

/** Routes morgan's access-log lines through our own logger for consistent formatting. */
export const requestLogger = morgan('short', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
  skip: () => process.env.NODE_ENV === 'test',
});
