import pino from 'pino';

// Create logger instance with environment-specific configuration
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
    paths: ['password', 'token', 'authorization', 'cookie'],
    censor: '[REDACTED]'
  }
});

// Custom logger methods for different contexts
export const createLogger = (context: string) => {
  return {
    info: (message: string, data?: any) => {
      logger.info({ context, ...data }, message);
    },
    error: (message: string, error?: any) => {
      logger.error({ context, error: error?.stack || error }, message);
    },
    warn: (message: string, data?: any) => {
      logger.warn({ context, ...data }, message);
    },
    debug: (message: string, data?: any) => {
      logger.debug({ context, ...data }, message);
    }
  };
};

// Production-safe console replacement
export const productionLogger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'production') {
      logger.info({ args }, 'Console log');
    } else {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (process.env.NODE_ENV === 'production') {
      logger.error({ args }, 'Console error');
    } else {
      console.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'production') {
      logger.warn({ args }, 'Console warning');
    } else {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (process.env.NODE_ENV === 'production') {
      logger.info({ args }, 'Console info');
    } else {
      console.info(...args);
    }
  }
};

export default logger;