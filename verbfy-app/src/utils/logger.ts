// Frontend logger utility for production environments
interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

type LogLevelName = LogLevel[keyof LogLevel];

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

class Logger {
  private isProduction: boolean;
  private logLevel: LogLevelName;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logLevel = this.normalizeLevel(
      process.env.NEXT_PUBLIC_LOG_LEVEL || (this.isProduction ? 'info' : 'debug')
    );
  }

  private normalizeLevel(level: string): LogLevelName {
    const l = level.toLowerCase();
    if (l === LOG_LEVELS.ERROR || l === LOG_LEVELS.WARN || l === LOG_LEVELS.INFO || l === LOG_LEVELS.DEBUG) {
      return l;
    }
    // Fallback to 'info' in production, 'debug' otherwise
    return this.isProduction ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;
  }

  setLevel(level: LogLevelName) {
    this.logLevel = level;
  }

  getLevel(): LogLevelName {
    return this.logLevel;
  }

  private shouldLog(level: LogLevelName): boolean {
    const levels: LogLevelName[] = [LOG_LEVELS.ERROR, LOG_LEVELS.WARN, LOG_LEVELS.INFO, LOG_LEVELS.DEBUG];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private safeStringify(obj: unknown): string {
    try {
      return JSON.stringify(obj, (_key, value) => {
        if (value instanceof Error) {
          return { name: value.name, message: value.message, stack: value.stack };
        }
        return value;
      });
    } catch {
      return '[unserializable]';
    }
  }

  private formatMessage(level: LogLevelName, context: string, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
    
    if (data && typeof data === 'object') {
      return `${baseMessage} ${this.safeStringify(data)}`;
    }
    
    return baseMessage;
  }

  private logToConsole(level: LogLevelName, context: string, message: string, data?: unknown) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, context, message, data);

    if (this.isProduction) {
      // In production, use structured logging
      const logData: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        level,
        context,
        message
      };
      
      if (data !== undefined) {
        logData.data = data;
      }

      // Send to external logging service if configured
      if (typeof window !== 'undefined') {
        type Gtag = (event: 'event', name: string, params?: Record<string, unknown>) => void;
        const w = window as unknown as { gtag?: Gtag };
        if (w.gtag) {
          w.gtag('event', 'log', {
          custom_parameter_level: level,
          custom_parameter_context: context,
          custom_parameter_message: message
          });
        }
      }

      // Still log to console but in structured format
      console.log(this.safeStringify(logData));
    } else {
      // Development mode - use regular console with colors
      switch (level) {
        case LOG_LEVELS.ERROR:
          if (data instanceof Error) {
            console.error(formattedMessage, data);
          } else {
            console.error(formattedMessage);
          }
          break;
        case LOG_LEVELS.WARN:
          console.warn(formattedMessage);
          break;
        case LOG_LEVELS.INFO:
          console.info(formattedMessage);
          break;
        case LOG_LEVELS.DEBUG:
          console.debug(formattedMessage);
          break;
        default:
          console.log(formattedMessage);
      }
    }
  }

  error(context: string, message: string, error?: unknown) {
    this.logToConsole(LOG_LEVELS.ERROR, context, message, error);
  }

  warn(context: string, message: string, data?: unknown) {
    this.logToConsole(LOG_LEVELS.WARN, context, message, data);
  }

  info(context: string, message: string, data?: unknown) {
    this.logToConsole(LOG_LEVELS.INFO, context, message, data);
  }

  debug(context: string, message: string, data?: unknown) {
    this.logToConsole(LOG_LEVELS.DEBUG, context, message, data);
  }
}

// Create singleton instance
const logger = new Logger();

// Production-safe console replacement
export const productionLogger = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'production') {
      logger.info('Console', 'Log message', { args });
    } else {
      console.log(...args);
    }
  },
  error: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'production') {
      logger.error('Console', 'Error message', { args });
    } else {
      console.error(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Console', 'Warning message', { args });
    } else {
      console.warn(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'production') {
      logger.info('Console', 'Info message', { args });
    } else {
      console.info(...args);
    }
  }
};

// Context-specific loggers
export const createLogger = (context: string) => ({
  error: (message: string, error?: unknown) => logger.error(context, message, error),
  warn: (message: string, data?: unknown) => logger.warn(context, message, data),
  info: (message: string, data?: unknown) => logger.info(context, message, data),
  debug: (message: string, data?: unknown) => logger.debug(context, message, data)
});

export default logger;