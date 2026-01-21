import { Router } from 'express';
import dashboardRoutes from './dashboard.routes.js';
import adminRoutes from './admin.routes.js';
import webhookRoutes from './webhook.routes.js';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: |
 *       Returns the current health status of the API server.
 *       Use this endpoint for load balancer health checks and monitoring.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-01-21T08:15:30.000Z"
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                   example: 3600.5
 *
 * /api/v1/health:
 *   get:
 *     summary: Health check (API versioned)
 *     description: Same as /health, available at versioned API path
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Dashboard Routes - CSAT data with filtering
 * Mounted at /api/v1/dashboard (since this router is at /api/v1)
 */
router.use('/dashboard', dashboardRoutes);

/**
 * Admin Routes - CRUD for SBU, Client, Brand with history tracking
 * Mounted at /api/v1/admin
 */
router.use('/admin', adminRoutes);

/**
 * Webhook Routes - Receive external data (Pabbly, etc.)
 * Mounted at /api/v1/webhook
 */
router.use('/webhook', webhookRoutes);

/**
 * @swagger
 * /api/v1:
 *   get:
 *     summary: API root - Version and endpoint information
 *     description: |
 *       Returns API version information and a summary of available endpoints.
 *       This is helpful for API discovery and verification.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "CSAT API v1"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 documentation:
 *                   type: object
 *                   description: Quick reference to main endpoints
 *             example:
 *               message: "CSAT API v1"
 *               version: "1.0.0"
 *               documentation:
 *                 swagger: "/api-docs"
 *                 filters:
 *                   description: "Get available filter options"
 *                   endpoint: "GET /api/v1/dashboard/filters"
 *                 filterByEntity:
 *                   description: "Filter responses by specific entity"
 *                   endpoints:
 *                     byDepartment: "GET /api/v1/dashboard/filter/department/:departmentId"
 *                     byBrand: "GET /api/v1/dashboard/filter/brand/:brandId"
 *                     byCycle: "GET /api/v1/dashboard/filter/cycle/:cycleId"
 *                     byYear: "GET /api/v1/dashboard/filter/year/:year"
 *                     bySBU: "GET /api/v1/dashboard/filter/sbu/:sbuId"
 */
router.get('/', (req, res) => {
  res.json({
    message: 'CSAT API v1',
    version: '1.0.0',
    documentation: {
      swagger: '/api-docs',
      swaggerJson: '/api-docs.json',
      filters: {
        description: 'Get available filter options',
        endpoint: 'GET /api/v1/dashboard/filters',
      },
      filterByEntity: {
        description: 'Filter responses by specific entity',
        endpoints: {
          byDepartment: 'GET /api/v1/dashboard/filter/department/:departmentId',
          byBrand: 'GET /api/v1/dashboard/filter/brand/:brandId',
          byCycle: 'GET /api/v1/dashboard/filter/cycle/:cycleId',
          byYear: 'GET /api/v1/dashboard/filter/year/:year',
          bySBU: 'GET /api/v1/dashboard/filter/sbu/:sbuId',
        },
        queryParams: [
          'page',
          'limit',
          'departmentId',
          'brandId',
          'cycleId',
          'year',
          'export',
        ],
      },
      statistics: {
        description: 'Get aggregated statistics',
        endpoint: 'GET /api/v1/dashboard/stats',
        queryParams: ['departmentId', 'brandId', 'cycleId', 'sbuId', 'year'],
      },
      aggregations: {
        description: 'Get aggregated data by entity',
        endpoints: {
          byDepartments: 'GET /api/v1/dashboard/aggregate/departments',
          byBrands: 'GET /api/v1/dashboard/aggregate/brands',
          bySBUs: 'GET /api/v1/dashboard/aggregate/sbus',
          byCycles: 'GET /api/v1/dashboard/aggregate/cycles',
        },
      },
      admin: {
        description: 'Admin CRUD operations',
        endpoints: {
          sbus: 'GET|POST /api/v1/admin/sbus',
          brands: 'GET|POST /api/v1/admin/brands',
          clients: 'GET|POST /api/v1/admin/clients',
          cycles: 'GET /api/v1/admin/cycles',
        },
      },
      webhook: {
        description: 'Receive external CSAT data',
        endpoint: 'POST /api/v1/webhook/csat',
      },
    },
  });
});

export default router;
