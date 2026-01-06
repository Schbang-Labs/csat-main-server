import logger from '#config/logger.js';
import { formatErrorResponse, isOperationalError } from '#utils/errors.js';

/**
 * Global Error Handler Middleware
 * Catches all errors and formats responses
 */
export const errorHandler = (err, req, res, _next) => {
  // Log error
  const logData = {
    message: err.message,
    statusCode: err.statusCode || 500,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    apiKey: req.apiKey,
  };

  if (err.statusCode >= 500) {
    logger.error('Server error', { ...logData, stack: err.stack });
  } else {
    logger.warn('Client error', logData);
  }

  // Determine if we should include stack trace
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Format error response
  const errorResponse = formatErrorResponse(err, isDevelopment);

  // Send response
  res.status(err.statusCode || 500).json(errorResponse);

  // If it's a programming error, we might want to crash in production
  if (!isOperationalError(err) && process.env.NODE_ENV === 'production') {
    logger.error('Non-operational error detected, consider restarting', {
      error: err.message,
      stack: err.stack,
    });
    // In production, you might want to:
    // process.exit(1);
  }
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req, res) => {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncErrorHandler = fn => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
