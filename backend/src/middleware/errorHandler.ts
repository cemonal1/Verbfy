import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const errorLogger = createLogger('ErrorHandler');

// Custom error types
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  
  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  errors: any[];
  
  constructor(message: string, errors: any[] = []) {
    super(message, 400, true);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, true);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, true);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(message, 404, true);
    this.name = 'NotFoundError';
  }
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;
  let errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  
  // Handle different types of errors
  if (err.name === 'ValidationError' && !err.statusCode) {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((e: any) => e.message);
  } else if (err.name === 'UnauthorizedError' && !err.statusCode) {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'ForbiddenError' && !err.statusCode) {
    statusCode = 403;
    message = 'Forbidden';
  } else if (err.name === 'NotFoundError' && !err.statusCode) {
    statusCode = 404;
    message = 'Not Found';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate key error';
    errors = Object.keys(err.keyValue).map(key => `${key} already exists`);
  } else if (err.status && !err.statusCode) {
    statusCode = err.status;
    message = err.message || message;
  }
  
  // Log error with structured logger
  errorLogger.error(`[${errorId}] ${message}`, {
    errorId,
    name: err.name,
    message: err.message,
    stack: err.stack,
    url: req.originalUrl || req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id || 'anonymous',
    statusCode
  });
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      id: errorId,
      message,
      ...(errors && { errors }),
      status: statusCode
    },
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route not found: ${req.originalUrl}`);
  next(error);
};