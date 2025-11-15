import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger';

const requestIdLogger = createLogger('RequestID');

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const existingRequestId = req.headers['x-request-id'] as string;
  const requestId = existingRequestId || uuidv4();

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  if (!existingRequestId) {
    requestIdLogger.debug(`Generated new request ID: ${requestId}`);
  }

  next();
};

export const getRequestId = (req: Request): string => {
  return req.requestId || 'unknown';
};
