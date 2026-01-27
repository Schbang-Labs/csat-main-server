/**
 * Custom Error Classes
 */

/**
 * Base API Error
 */
export class APIError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Bad Request Error (400)
 */
export class BadRequestError extends APIError {
  constructor(message = 'Bad request') {
    super(message, 400);
    this.name = 'BadRequestError';
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends APIError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends APIError {
  constructor(message = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends APIError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends APIError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Validation Error (422)
 */
export class ValidationError extends APIError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 422);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Rate Limit Error (429)
 */
// RateLimitError removed because rate limiting is disabled. Keep error types minimal.

/**
 * Internal Server Error (500)
 */
export class InternalError extends APIError {
  constructor(message = 'Internal server error') {
    super(message, 500);
    this.name = 'InternalError';
  }
}

/**
 * Check if error is operational (expected) vs programming error
 * @param {Error} error
 * @returns {boolean}
 */
export const isOperationalError = error => {
  if (error instanceof APIError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Format error response for API
 * @param {Error} error
 * @param {boolean} includeStack - Include stack trace in response
 * @returns {Object}
 */
export const formatErrorResponse = (error, includeStack = false) => {
  const response = {
    status: 'error',
    message: error.message || 'An unexpected error occurred',
    code: error.name || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  };

  if (error instanceof ValidationError && error.errors?.length > 0) {
    response.errors = error.errors;
  }

  if (includeStack && error.stack) {
    response.stack = error.stack;
  }

  return response;
};
