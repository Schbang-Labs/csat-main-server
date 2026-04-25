import winston from 'winston';
import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport';

const isProduction = process.env.NODE_ENV === 'production';

// In containers, write logs only to stdout (Docker captures, OTel ships a
// copy to VictoriaLogs). File transports are dev-only — containers shouldn't
// write to a mutable filesystem and the disk would never be rotated.
const transports = [];
if (!isProduction) {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'csat-server' },
  transports,
});

// Console transport — human-readable in dev, structured in prod (Docker stdout).
logger.add(
  new winston.transports.Console({
    format: isProduction
      ? winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(
          ({ level, message, timestamp }) =>
            `${timestamp} [${level.toUpperCase()}]: ${message}`
        )
      )
      : winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
  })
);

// OTel log transport — ships every record to the Collector with trace_id /
// span_id auto-attached by @opentelemetry/instrumentation-winston (correlation
// stays on; only auto-send is disabled in tracing.js so we control the export
// path here). Filters below run BEFORE records leave the process.

// 1. Drop /health + /api-docs noise. All call sites in this codebase pass
//    `path` as a top-level meta field (verified: requestLogger middleware,
//    rateLimit middleware) so the structured check is sufficient.
const skipNoise = winston.format(info => {
  const path = info.path;
  if (typeof path === 'string' && (path === '/health' || path.startsWith('/api-docs'))) {
    return false;
  }
  return info;
})();

// 2. Allowlist Winston levels before they become VictoriaLogs stream fields.
//    `severity` is a stream field (low-cardinality, indexed) — an unbounded
//    custom level (e.g. logger.log('debug-userId-X', ...)) would explode the
//    stream count. Coerce anything outside the allowlist to 'info'.
const ALLOWED_LEVELS = new Set(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']);
const levelGuard = winston.format(info => {
  if (!ALLOWED_LEVELS.has(info.level)) {
    return { ...info, level: 'info' };
  }
  return info;
})();

logger.add(
  new OpenTelemetryTransportV3({
    format: winston.format.combine(skipNoise, levelGuard, winston.format.json()),
  })
);

export default logger;
