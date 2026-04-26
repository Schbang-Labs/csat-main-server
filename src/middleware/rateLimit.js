import logger from '#config/logger.js';
import { shouldSkipPathLogging } from '#utils/scannerPaths.js';

/**
 * Rate limiting is disabled for now. Export no-op middlewares that
 * preserve the same API (so existing route wiring doesn't need changes).
 */

const noopRateLimiter = (req, _res, next) => {
  // Helpful debug log so devs know rate limiting is intentionally off.
  // Suppressed for /health, /api-docs, and scanner-noise paths so the
  // log doesn't flood VictoriaLogs with the same line every 30s and on
  // every bot scan. Real API requests still log this once per request.
  if (!shouldSkipPathLogging(req.path)) {
    logger.info('Rate limiting disabled - passing request through', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
  }
  return next();
};

export const defaultRateLimiter = noopRateLimiter;
export const webhookRateLimiter = noopRateLimiter;
export const adminRateLimiter = noopRateLimiter;

/**
 * Create custom rate limiter - returns a no-op middleware for compatibility.
 * Parameters are accepted but ignored to keep call sites unchanged.
 */
export const createRateLimiter = (_windowMs, _max) => noopRateLimiter;
