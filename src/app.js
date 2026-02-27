import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import showCsatRoutes from './routes/showCsat.routes.js';
import apiRoutes from './routes/index.js';
import { clientContextMiddleware } from './middleware/clientContext.middleware.js';
// import { optionalSessionMiddleware } from './middleware/optionalSession.middleware.js';
import { requestLoggerMiddleware } from './middleware/requestLogger.middleware.js';
import { defaultRateLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { swaggerSpec, swaggerUi } from './swagger_docs/swagger/swagger.js';
const app = express();

const DEFAULT_ALLOWED_ORIGINS = [
  'https://secondbrain.schbanglabs.com',
  'https://secondbrain-preview.schbanglabs.com',
  'https://secondbrain-dev.schbanglabs.com',
  'http://localhost:3000',
];
const KNOWN_ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/secondbrain(?:-preview|-dev)?\.schbanglabs\.com$/,
  /^http:\/\/localhost:3000$/,
];

const stripWrappingQuotes = value => {
  let trimmed = value.trim();

  while (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith('\'') && trimmed.endsWith('\'')))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  return trimmed;
};

const normalizeOrigin = value => {
  if (typeof value !== 'string') return '';
  const unquoted = stripWrappingQuotes(value);
  if (!unquoted) return '';
  return unquoted.endsWith('/')
    ? unquoted.slice(0, -1).toLowerCase()
    : unquoted.toLowerCase();
};

const parseAllowedOrigins = value => {
  if (typeof value !== 'string' || !value.trim()) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  const normalizedInput = value.trim();
  const unwrappedInput = stripWrappingQuotes(normalizedInput);

  try {
    if (unwrappedInput.startsWith('[')) {
      const parsed = JSON.parse(unwrappedInput);
      if (Array.isArray(parsed)) {
        const normalizedOrigins = parsed
          .map(normalizeOrigin)
          .filter(Boolean);
        if (normalizedOrigins.length > 0) {
          return normalizedOrigins;
        }
      }
    }
  } catch (error) {
    console.error('Failed to parse FRONTEND_URL as JSON array:', error);
  }

  const normalizedOrigins = unwrappedInput
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  return normalizedOrigins.length > 0
    ? normalizedOrigins
    : DEFAULT_ALLOWED_ORIGINS;
};

// Trust proxy (required when behind Nginx/load balancer)
// This allows rate limiting to work correctly with X-Forwarded-For header
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration - Allow explicitly from FRONTEND_URL env variable
const allowedOrigins = Array.from(
  new Set([
    ...DEFAULT_ALLOWED_ORIGINS.map(normalizeOrigin),
    ...parseAllowedOrigins(process.env.FRONTEND_URL),
  ])
);
const allowedOriginsSet = new Set(allowedOrigins);
const isKnownAllowedOrigin = origin =>
  KNOWN_ALLOWED_ORIGIN_PATTERNS.some(pattern => pattern.test(origin));

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const normalizedOrigin = normalizeOrigin(origin);

      if (
        allowedOriginsSet.has(normalizedOrigin) ||
        isKnownAllowedOrigin(normalizedOrigin)
      ) {
        return callback(null, true);
      }

      console.warn(`CORS blocked for origin: ${origin}`);
      return callback(null, false); // Don't throw error, just don't set CORS headers
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Client-Type',
      'x-client-type',
      'X-Client-Secret',
      'x-client-secret',
      'X-User-Email',
      'x-user-email',
      'X-Timestamp',
      'x-timestamp',
      'X-Signature',
      'x-signature',
      'X-Request-Id',
      'x-request-id',
    ],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(clientContextMiddleware);
// app.use(optionalSessionMiddleware);
app.use(requestLoggerMiddleware);

// Rate limiting (applied to all routes except health check and swagger)
app.use((req, res, next) => {
  if (req.path.startsWith('/api-docs')) {
    return next();
  }
  return defaultRateLimiter(req, res, next);
});

// ============================================
// Swagger API Documentation
// ============================================
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { font-size: 2.5em }
  `,
    customSiteTitle: 'CSAT API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      docExpansion: 'list',
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  })
);

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check endpoint - public, no auth required
app.get('/health', (req, res) => {

  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'CSAT Server',
    version: '1.0.0',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'CSAT Server',
    version: '1.0.0',
    documentation: '/api-docs',
    api: '/api/v1',
    health: '/health',
  });
});

// API v1 routes
app.use('/api/v1', apiRoutes);

// Authentication routes (session-based)
app.use('/auth', authRoutes);

// Global route to check CSAT screen access by user email
app.use('/show-csat', showCsatRoutes);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

export default app;
