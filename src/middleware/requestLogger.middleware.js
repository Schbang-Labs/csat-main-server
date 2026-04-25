import { randomUUID } from 'crypto';
import { trace } from '@opentelemetry/api';
import logger from '#config/logger.js';
import {
  buildRequestLogMeta,
  sanitizeForLogs,
  getRequestUserIdSafe,
} from '#utils/logging.util.js';

const shouldSkipLogging = req =>
  req.path === '/health' || req.path.startsWith('/api-docs');

export const requestLoggerMiddleware = (req, res, next) => {
  if (shouldSkipLogging(req)) {
    return next();
  }

  const incomingRequestId = req.headers['x-request-id'];
  const requestId =
    typeof incomingRequestId === 'string' && incomingRequestId.trim().length > 0
      ? incomingRequestId.trim()
      : randomUUID();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  // Stamp the request ID onto the active OTel span so Tempo can be searched
  // by it. Lets you jump from a log line → its trace → all related spans.
  trace.getActiveSpan()?.setAttribute('http.request_id', requestId);

  const requestMeta = buildRequestLogMeta(req);
  req.requestLogMeta = requestMeta;

  logger.info('API request received', requestMeta);

  const startedAt = process.hrtime.bigint();
  const originalJson = res.json.bind(res);
  res.json = payload => {
    res.locals.responseBodyForLog = sanitizeForLogs(payload);
    return originalJson(payload);
  };

  res.on('finish', () => {
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const baseMeta = {
      requestId,
      method: req.method,
      path: req.originalUrl || req.path,
      statusCode: res.statusCode,
      durationMs: Number(elapsedMs.toFixed(2)),
      userId: getRequestUserIdSafe(req),
    };

    if (res.statusCode >= 500) {
      logger.error('API request completed with server error', {
        ...baseMeta,
        response: res.locals.responseBodyForLog,
      });
      return;
    }

    if (res.statusCode >= 400) {
      logger.warn('API request completed with client error', {
        ...baseMeta,
        response: res.locals.responseBodyForLog,
      });
      return;
    }

    logger.info('API request completed', baseMeta);
  });

  return next();
};

export default requestLoggerMiddleware;
