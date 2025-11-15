import pino from 'pino';
import { Request } from 'express';

const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ['password', 'token', 'authorization', 'cookie', 'secret', 'apiKey'],
    censor: '[REDACTED]'
  }
});

export interface LogData {
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
}

export const createLogger = (context: string) => {
  return {
    info: (message: string, data?: LogData) => {
      logger.info({ context, ...data }, message);
    },
    error: (message: string, error?: unknown) => {
      const errorData = error instanceof Error
        ? { error: error.message, stack: error.stack }
        : { error };
      logger.error({ context, ...errorData }, message);
    },
    warn: (message: string, data?: LogData) => {
      logger.warn({ context, ...data }, message);
    },
    debug: (message: string, data?: LogData) => {
      logger.debug({ context, ...data }, message);
    }
  };
};

export const createRequestLogger = (context: string, req: Request) => {
  const requestId = (req as { requestId?: string }).requestId;
  const userId = (req as { user?: { id?: string } }).user?.id;

  return {
    info: (message: string, data?: LogData) => {
      logger.info({ context, requestId, userId, ...data }, message);
    },
    error: (message: string, error?: unknown) => {
      const errorData = error instanceof Error
        ? { error: error.message, stack: error.stack }
        : { error };
      logger.error({ context, requestId, userId, ...errorData }, message);
    },
    warn: (message: string, data?: LogData) => {
      logger.warn({ context, requestId, userId, ...data }, message);
    },
    debug: (message: string, data?: LogData) => {
      logger.debug({ context, requestId, userId, ...data }, message);
    }
  };
};

export const productionLogger = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'production') {
      logger.info({ args }, 'Console log');
    } else {
      logger.info(...args);
    }
  },
  error: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'production') {
      logger.error({ args }, 'Console error');
    } else {
      logger.error(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'production') {
      logger.warn({ args }, 'Console warning');
    } else {
      logger.warn(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'production') {
      logger.info({ args }, 'Console info');
    } else {
      console.info(...args);
    }
  }
};

export default logger;
