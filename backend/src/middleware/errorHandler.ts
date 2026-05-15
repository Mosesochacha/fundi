import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../utils/constants';
import { logError } from '../utils/helpers';
import * as Sentry from '@sentry/node';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logError(error, 'Global Error Handler');

  // Report to Sentry (skip 401/403 auth errors to reduce noise)
  if (process.env.SENTRY_DSN && error.statusCode !== 401 && error.statusCode !== 403) {
    Sentry.captureException(error, {
      tags: {
        errorType: 'express_error_handler',
        statusCode: error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
      extra: {
        url: req.originalUrl,
        method: req.method,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
      },
      contexts: {
        request: {
          url: req.originalUrl,
          method: req.method,
          headers: req.headers,
        },
      },
    });
  }

  // Default error values
  let statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = error.message || 'Internal server error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Validation error';
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    statusCode = HTTP_STATUS.CONFLICT;
    message = 'Duplicate entry';
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Invalid reference';
  }

  if (error.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Token expired';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error,
    }),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Handle 404 errors
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Create an operational error
 */
export const createError = (message: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};