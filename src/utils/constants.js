/**
 * Application Constants
 */

/**
 * Rate Limiting Configuration
 */
export const RATE_LIMITS = {
  DEFAULT: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000, // 1000 requests per hour
  },
  WEBHOOK: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
  },
  ADMIN: {
    windowMs: 60 * 1000, // 1 minute
    max: 50, // 50 requests per minute
  },
};

/**
 * Valid Departments
 */
export const DEPARTMENTS = [
  'Brand Solutions',
  'Media',
  'Tech',
  'SEO',
  'MarTech',
  'Fluence',
  'SMP',
];

/**
 * CSAT Score Classification
 */
export const CSAT_CLASSIFICATION = {
  GOOD: 3.75,
  AVERAGE: 3.0,
};

/**
 * Cycle Configuration
 */
export const CYCLE_CONFIG = {
  CYCLES_PER_YEAR: 6,
  START_MONTH: 4, // May (0-indexed)
};
