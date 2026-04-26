import { trace, SpanStatusCode } from '@opentelemetry/api';
import logger from '#config/logger.js';
import { formatErrorResponse, isOperationalError } from '#utils/errors.js';
import { buildRequestLogMeta, sanitizeForLogs } from '#utils/logging.util.js';
import { shouldSkipPathLogging } from '#utils/scannerPaths.js';

/**
 * Global Error Handler Middleware
 * Catches all errors and formats responses
 */
export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;

  // Mark the active HTTP span as failed so:
  //  - Tempo renders it red
  //  - The collector's tail_sampling keep-errors policy retains the trace
  // Only set status=ERROR for 5xx; 4xx are client faults and shouldn't
  // poison the error rate.
  if (statusCode >= 500) {
    const span = trace.getActiveSpan();
    if (span) {
      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
    }
  }

  const requestMeta = {
    ...(req.requestLogMeta || {}),
    ...buildRequestLogMeta(req),
  };
  const logData = {
    ...requestMeta,
    statusCode,
    errorName: err.name,
    errorMessage: err.message,
  };

  if (statusCode >= 500) {
    logger.error('Server error', { ...logData, stack: err.stack });
  } else {
    logger.warn('Client error', logData);
  }

  // Determine if we should include stack trace
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Format error response
  const errorResponse = formatErrorResponse(err, isDevelopment);

  // Send response
  res.status(statusCode).json(errorResponse);

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
 *
 * Skips the warn log for scanner-noise paths (`.env` probes, `*.php`,
 * wp-admin etc.) AND the standard suppress list (/health, /api-docs).
 * The 404 RESPONSE is still returned to the caller — only the log line
 * is suppressed, so VictoriaLogs / dashboards aren't drowned by bot
 * scans. Real 404s for legitimate paths still log.
 */
export const notFoundHandler = (req, res) => {
  const skipLog = shouldSkipPathLogging(req.path);

  if (!skipLog) {
    const requestMeta = {
      ...(req.requestLogMeta || {}),
      ...buildRequestLogMeta(req),
    };
    logger.warn('Route not found', requestMeta);
  }

  const payload = {
    status: 'error',
    message: 'Route not found',
    path: req.path,
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(payload);
  res.locals.responseBodyForLog = sanitizeForLogs(payload);
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
