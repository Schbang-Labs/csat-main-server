import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '#utils/constants.js';
import { RateLimitError } from '#utils/errors.js';
import logger from '#config/logger.js';

/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse
 */

/**
 * Custom rate limit handler
 */
const rateLimitHandler = (req, _res) => {
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    path: req.path,
    method: req.method,
  });

  throw new RateLimitError('Too many requests, please try again later');
};

/**
 * Default rate limiter
 * 1000 requests per hour
 */
export const defaultRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.DEFAULT.windowMs,
  max: RATE_LIMITS.DEFAULT.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: req => {
    // Skip rate limiting for health check
    return req.path === '/health';
  },
});

/**
 * Webhook rate limiter
 * 100 requests per minute
 */
export const webhookRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.WEBHOOK.windowMs,
  max: RATE_LIMITS.WEBHOOK.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: req => {
    // Rate limit by source instead of IP for webhooks
    return req.params.source || req.ip;
  },
});

/**
 * Admin endpoints rate limiter
 * 50 requests per minute
 */
export const adminRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.ADMIN.windowMs,
  max: RATE_LIMITS.ADMIN.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Create custom rate limiter
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} max - Maximum requests per window
 */
export const createRateLimiter = (windowMs, max) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
  });
};
