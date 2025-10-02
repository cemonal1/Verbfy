// Frontend logger utility for production environments
interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

class Logger {
  private isProduction: boolean;
  private logLevel: string;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logLevel = process.env.NEXT_PUBLIC_LOG_LEVEL || (this.isProduction ? 'info' : 'debug');
  }

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatMessage(level: string, context: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
    
    if (data && typeof data === 'object') {
      return `${baseMessage} ${JSON.stringify(data)}`;
    }
    
    return baseMessage;
  }

  private logToConsole(level: string, context: string, message: string, data?: any) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, context, message, data);

    if (this.isProduction) {
      // In production, use structured logging
      const logData = {
        timestamp: new Date().toISOString(),
        level,
        context,
        message,
        ...(data && { data })
      };

      // Send to external logging service if configured
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'log', {
          custom_parameter_level: level,
          custom_parameter_context: context,
          custom_parameter_message: message
        });
      }

      // Still log to console but in structured format
      console.log(JSON.stringify(logData));
    } else {
      // Development mode - use regular console with colors
      switch (level) {
        case LOG_LEVELS.ERROR:
          console.error(formattedMessage);
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

  error(context: string, message: string, error?: any) {
    this.logToConsole(LOG_LEVELS.ERROR, context, message, error);
  }

  warn(context: string, message: string, data?: any) {
    this.logToConsole(LOG_LEVELS.WARN, context, message, data);
  }

  info(context: string, message: string, data?: any) {
    this.logToConsole(LOG_LEVELS.INFO, context, message, data);
  }

  debug(context: string, message: string, data?: any) {
    this.logToConsole(LOG_LEVELS.DEBUG, context, message, data);
  }
}

// Create singleton instance
const logger = new Logger();

// Production-safe console replacement
export const productionLogger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'production') {
      logger.info('Console', 'Log message', { args });
    } else {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (process.env.NODE_ENV === 'production') {
      logger.error('Console', 'Error message', { args });
    } else {
      console.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Console', 'Warning message', { args });
    } else {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (process.env.NODE_ENV === 'production') {
      logger.info('Console', 'Info message', { args });
    } else {
      console.info(...args);
    }
  }
};

// Context-specific loggers
export const createLogger = (context: string) => ({
  error: (message: string, error?: any) => logger.error(context, message, error),
  warn: (message: string, data?: any) => logger.warn(context, message, data),
  info: (message: string, data?: any) => logger.info(context, message, data),
  debug: (message: string, data?: any) => logger.debug(context, message, data)
});

export default logger;