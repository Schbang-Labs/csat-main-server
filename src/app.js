import express from 'express';
import logger from '#config/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRoutes from './routes/index.js';
import { defaultRateLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { swaggerSpec, swaggerUi } from './docs/swagger/swagger.js';

const app = express();

// Trust proxy (required when behind Nginx/load balancer)
// This allows rate limiting to work correctly with X-Forwarded-For header
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = (() => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  try {
    // Try to parse as JSON array
    const parsed = JSON.parse(frontendUrl);
    return Array.isArray(parsed) ? parsed : [frontendUrl];
  } catch {
    // If not JSON, treat as single origin string
    return [frontendUrl];
  }
})();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, origin);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging middleware
app.use(
  morgan('combined', {
    stream: { write: message => logger.info(message.trim()) },
    skip: req => req.path === '/health' || req.path.startsWith('/api-docs'), // Skip health and swagger logs
  })
);

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

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

export default app;
