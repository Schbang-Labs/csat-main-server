import { Router } from 'express';

const router = Router();

/**
 * Health Check Route
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * API v1 Routes
 * TODO: Add CSAT-specific routes
 */
router.get('/', (req, res) => {
  res.json({
    message: 'CSAT API v1',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      departments: '/api/v1/departments',
      sbus: '/api/v1/sbus',
      brands: '/api/v1/brands',
      clients: '/api/v1/clients',
      cycles: '/api/v1/cycles',
      responses: '/api/v1/responses',
    },
  });
});

export default router;
