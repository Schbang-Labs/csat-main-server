/**
 * Admin Routes
 * CRUD endpoints for SBU, Client, and Brand management with history tracking
 */

import { Router } from 'express';
import {
  // SBU
  createSBU,
  updateSBU,
  getAllSBUs,
  getSBUById,
  getSBUHistory,
  // Client
  createClient,
  updateClient,
  getAllClients,
  getClientById,
  getClientHistory,
  // Brand
  createBrand,
  updateBrand,
  getAllBrands,
  getBrandById,
  getBrandHistory,
  updateBrandPocs,
  // Cycles
  createCycle,
  updateCycle,
  getAllCycles,
  finalizeCycle,
} from '../controllers/admin/admin.controller.js';
import { authorize } from '../middleware/authorization.middleware.js';

const router = Router();
const requireAdmin = authorize({
  role: 'admin',
});

const allowCycleRead = authorize({
  role: ['admin', 'head_department', 'sbu'],
  requiredScopeByRole: {
    head_department: 'department',
    sbu: 'sbu',
  },
});

const allowScopedAdminRead = authorize({
  role: ['admin', 'head_department', 'sbu'],
  requiredScopeByRole: {
    head_department: 'department',
    sbu: 'sbu',
  },
});

// Read cycles is used by non-admin dashboards as well.
router.get('/cycles', allowCycleRead, getAllCycles);

// ============================================
// SBU Routes
// ============================================

/**
 * @swagger
 * /api/v1/admin/sbus:
 *   get:
 *     summary: Get all SBUs
 *     description: |
 *       Returns all active Strategic Business Units (SBUs/PODs) with their
 *       department association and leadership information.
 *     tags: [Admin - SBU]
 *     responses:
 *       200:
 *         description: SBUs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 15
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SBU'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Create a new SBU
 *     description: |
 *       Creates a new Strategic Business Unit with optional leadership
 *       assignments and brand associations.
 *
 *       The slug is auto-generated from the name if not provided.
 *     tags: [Admin - SBU]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSBURequest'
 *           example:
 *             name: "POD Phoenix"
 *             departmentId: "507f1f77bcf86cd799439011"
 *             executiveVP: "John Smith"
 *             associateVP: "Jane Doe"
 *             creativeDirector: "Bob Wilson"
 *             brands: ["507f1f77bcf86cd799439012"]
 *     responses:
 *       201:
 *         description: SBU created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "SBU created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/SBU'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 */
router.get('/sbus', allowScopedAdminRead, getAllSBUs);
router.post('/sbus', requireAdmin, createSBU);

/**
 * @swagger
 * /api/v1/admin/sbus/{id}:
 *   get:
 *     summary: Get SBU by ID
 *     description: |
 *       Returns a single SBU with full details.
 *
 *       **Historical Data:** Pass `?cycleId=xxx` to get the SBU's
 *       historical snapshot from a specific cycle (leadership, brands, etc.).
 *     tags: [Admin - SBU]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the SBU
 *       - in: query
 *         name: cycleId
 *         schema:
 *           type: string
 *         description: Optional cycle ID for historical data
 *     responses:
 *       200:
 *         description: SBU retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SBU'
 *       404:
 *         description: SBU not found
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update an SBU
 *     description: |
 *       Updates an existing SBU's information including leadership
 *       assignments and brand associations.
 *
 *       Only provided fields will be updated; others remain unchanged.
 *     tags: [Admin - SBU]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the SBU
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSBURequest'
 *           example:
 *             executiveVP: "New VP Name"
 *             associateVPs: ["VP1", "VP2"]
 *             brands: ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
 *     responses:
 *       200:
 *         description: SBU updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/SBU'
 *       404:
 *         description: SBU not found
 *       500:
 *         description: Server error
 */
router.get('/sbus/:id', allowScopedAdminRead, getSBUById);
router.put('/sbus/:id', requireAdmin, updateSBU);

/**
 * @swagger
 * /api/v1/admin/sbus/{id}/history:
 *   get:
 *     summary: Get SBU change history
 *     description: |
 *       Returns all historical snapshots of an SBU across different cycles.
 *       Shows how leadership and brand assignments changed over time.
 *     tags: [Admin - SBU]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the SBU
 *     responses:
 *       200:
 *         description: History retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SBUHistory'
 *       500:
 *         description: Server error
 */
router.get('/sbus/:id/history', requireAdmin, getSBUHistory);

// ============================================
// Client Routes
// ============================================

/**
 * @swagger
 * /api/v1/admin/clients:
 *   get:
 *     summary: Get all clients/POCs
 *     description: |
 *       Returns all active client points of contact.
 *       Can be filtered by brand.
 *     tags: [Admin - Client]
 *     parameters:
 *       - in: query
 *         name: brandId
 *         schema:
 *           type: string
 *         description: Filter by Brand ObjectId
 *     responses:
 *       200:
 *         description: Clients retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Client'
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create a new client/POC
 *     description: |
 *       Creates a new client point of contact for a brand.
 *
 *       **Note:** Phone number must be unique per brand.
 *     tags: [Admin - Client]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClientRequest'
 *           example:
 *             brandId: "507f1f77bcf86cd799439011"
 *             name: "John Doe"
 *             phone: "9876543210"
 *             email: "john@company.com"
 *             serviceMapping:
 *               - department: "solutions"
 *                 isActive: true
 *     responses:
 *       201:
 *         description: Client created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Client'
 *       400:
 *         description: Validation error or duplicate phone
 *       500:
 *         description: Server error
 */
router.get('/clients', allowScopedAdminRead, getAllClients);
router.post('/clients', requireAdmin, createClient);

/**
 * @swagger
 * /api/v1/admin/clients/{id}:
 *   get:
 *     summary: Get client by ID
 *     description: |
 *       Returns a single client with full details including populated brand.
 *
 *       **Historical Data:** Pass `?cycleId=xxx` to get historical snapshot.
 *     tags: [Admin - Client]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the client
 *       - in: query
 *         name: cycleId
 *         schema:
 *           type: string
 *         description: Optional cycle ID for historical data
 *     responses:
 *       200:
 *         description: Client retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Client'
 *       404:
 *         description: Client not found
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update a client
 *     description: Updates an existing client's information.
 *     tags: [Admin - Client]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the client
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateClientRequest'
 *           example:
 *             name: "John Smith"
 *             email: "john.smith@company.com"
 *     responses:
 *       200:
 *         description: Client updated successfully
 *       404:
 *         description: Client not found
 *       500:
 *         description: Server error
 */
router.get('/clients/:id', allowScopedAdminRead, getClientById);
router.put('/clients/:id', requireAdmin, updateClient);

/**
 * @swagger
 * /api/v1/admin/clients/{id}/history:
 *   get:
 *     summary: Get client change history
 *     description: |
 *       Returns all historical snapshots of a client across different cycles.
 *     tags: [Admin - Client]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the client
 *     responses:
 *       200:
 *         description: History retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ClientHistory'
 *       500:
 *         description: Server error
 */
router.get('/clients/:id/history', requireAdmin, getClientHistory);

// ============================================
// Brand Routes
// ============================================

/**
 * @swagger
 * /api/v1/admin/brands:
 *   get:
 *     summary: Get all brands
 *     description: |
 *       Returns all active brands with service mappings.
 *       Can be filtered by department or SBU.
 *     tags: [Admin - Brand]
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *           enum: [solutions, media, tech, seo, martech, fluence, smp]
 *         description: Filter by department code
 *       - in: query
 *         name: sbuId
 *         schema:
 *           type: string
 *         description: Filter by SBU ObjectId
 *     responses:
 *       200:
 *         description: Brands retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Brand'
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create a new brand
 *     description: |
 *       Creates a new brand with optional service mappings.
 *
 *       The slug is auto-generated from the name if not provided.
 *     tags: [Admin - Brand]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBrandRequest'
 *           example:
 *             name: "Tata Motors"
 *             secondBrainId: 12345
 *             services:
 *               - department: "solutions"
 *                 sbuId: "507f1f77bcf86cd799439011"
 *               - department: "media"
 *     responses:
 *       201:
 *         description: Brand created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Brand'
 *       400:
 *         description: Validation error or duplicate slug
 *       500:
 *         description: Server error
 */
router.get('/brands', allowScopedAdminRead, getAllBrands);
router.post('/brands', requireAdmin, createBrand);

/**
 * @swagger
 * /api/v1/admin/brands/{id}:
 *   get:
 *     summary: Get brand by ID
 *     description: |
 *       Returns a single brand with full details including populated services.
 *
 *       **Historical Data:** Pass `?cycleId=xxx` to get historical snapshot.
 *     tags: [Admin - Brand]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the brand
 *       - in: query
 *         name: cycleId
 *         schema:
 *           type: string
 *         description: Optional cycle ID for historical data
 *     responses:
 *       200:
 *         description: Brand retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Brand'
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update a brand
 *     description: Updates an existing brand's information and service mappings.
 *     tags: [Admin - Brand]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the brand
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBrandRequest'
 *           example:
 *             name: "Tata Motors Ltd"
 *             services:
 *               - department: "solutions"
 *                 sbuId: "507f1f77bcf86cd799439011"
 *                 isActive: true
 *     responses:
 *       200:
 *         description: Brand updated successfully
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Server error
 */
router.get('/brands/:id', allowScopedAdminRead, getBrandById);
router.put('/brands/:id', requireAdmin, updateBrand);

/**
 * @swagger
 * /api/v1/admin/brands/{id}/history:
 *   get:
 *     summary: Get brand change history
 *     description: |
 *       Returns all historical snapshots of a brand across different cycles.
 *       Shows how name, services, and SBU assignments changed over time.
 *     tags: [Admin - Brand]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the brand
 *     responses:
 *       200:
 *         description: History retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BrandHistory'
 *       500:
 *         description: Server error
 */
router.get('/brands/:id/history', requireAdmin, getBrandHistory);

/**
 * @swagger
 * /api/v1/admin/brands/{id}/pocs:
 *   put:
 *     summary: Update brand POCs
 *     description: |
 *       Updates the list of Points of Contact (POCs) for a brand.
 *       Replaces the existing POC associations.
 *     tags: [Admin - Brand]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the brand
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBrandPocsRequest'
 *           example:
 *             pocs: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *     responses:
 *       200:
 *         description: POCs updated successfully
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Server error
 */
router.put('/brands/:id/pocs', requireAdmin, updateBrandPocs);

// ============================================
// Cycle Routes
// ============================================

/**
 * @swagger
 * /api/v1/admin/cycles:
 *   get:
 *     summary: Get all cycles
 *     description: |
 *       Returns all CSAT cycles, optionally filtered by year.
 *       Cycles are returned sorted by year and cycle number.
 *     tags: [Admin - Cycle]
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year (e.g., 2025)
 *     responses:
 *       200:
 *         description: Cycles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Cycle'
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create cycles for a year
 *     description: |
 *       Creates all 6 CSAT cycles for the specified year.
 *
 *       Each year has 6 cycles:
 *       - Cycle 1: May
 *       - Cycle 2: June-July
 *       - Cycle 3: August
 *       - Cycle 4: September-October
 *       - Cycle 5: November
 *       - Cycle 6: December
 *
 *       All cycles are created with status 'upcoming' by default.
 *     tags: [Admin - Cycle]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - year
 *             properties:
 *               year:
 *                 type: integer
 *                 description: Year to create cycles for
 *                 example: 2027
 *           example:
 *             year: 2027
 *     responses:
 *       201:
 *         description: Cycles created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Created 6 cycles for year 2027"
 *                 count:
 *                   type: integer
 *                   example: 6
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Cycle'
 *       400:
 *         description: Invalid year
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Cycles already exist for this year
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Cycles for year 2027 already exist"
 *                 data:
 *                   type: object
 *                   properties:
 *                     existingCycles:
 *                       type: array
 *       500:
 *         description: Server error
 */
router.post('/cycles', requireAdmin, createCycle);

/**
 * @swagger
 * /api/v1/admin/cycles/{cycleId}:
 *   put:
 *     summary: Update a cycle
 *     description: |
 *       Updates cycle status and/or isActive flag.
 *
 *       **Status Transitions:**
 *       - upcoming → active: Marks the cycle as the current active cycle
 *       - active → closed: Closes the cycle (responses no longer accepted)
 *       - closed → completed: Finalizes the cycle
 *
 *       **Note:** When setting status to 'active', all other active cycles
 *       will be automatically set to 'closed'.
 *     tags: [Admin - Cycle]
 *     parameters:
 *       - in: path
 *         name: cycleId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the cycle
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [upcoming, active, closed, completed]
 *                 description: New status for the cycle
 *               isActive:
 *                 type: boolean
 *                 description: Whether the cycle is active (visible in system)
 *           examples:
 *             activateCycle:
 *               summary: Activate a cycle
 *               value:
 *                 status: "active"
 *             closeCycle:
 *               summary: Close a cycle
 *               value:
 *                 status: "closed"
 *             completeCycle:
 *               summary: Mark cycle as completed
 *               value:
 *                 status: "completed"
 *             deactivateCycle:
 *               summary: Deactivate a cycle (hide from system)
 *               value:
 *                 isActive: false
 *     responses:
 *       200:
 *         description: Cycle updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cycle \"Cycle 1\" (2026) updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Cycle'
 *       400:
 *         description: Invalid status or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Cycle not found
 *       500:
 *         description: Server error
 */
router.put('/cycles/:cycleId', requireAdmin, updateCycle);

/**
 * @swagger
 * /api/v1/admin/cycles/{cycleId}/finalize:
 *   post:
 *     summary: Finalize a cycle and create history snapshots
 *     description: |
 *       Finalizes a completed cycle by creating historical snapshots of all entities.
 *
 *       **Process:**
 *       1. Creates snapshots of all SBUs with their leadership and brands
 *       2. Creates snapshots of all Brands with their services
 *       3. Creates snapshots of all Clients with their service mappings
 *       4. Updates all CSAT Responses with history reference IDs
 *       5. Marks the cycle as finalized
 *
 *       **Idempotency:** This endpoint can only be called ONCE per cycle.
 *       Calling it again returns 409 Conflict unless `?force=true` is passed.
 *
 *       **Warning:** Use `force=true` with caution as it will recreate all history snapshots.
 *     tags: [Admin - Cycle]
 *     parameters:
 *       - in: path
 *         name: cycleId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the cycle
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force re-finalization of already finalized cycle
 *     responses:
 *       200:
 *         description: Cycle finalized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cycle finalized successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     cycle:
 *                       $ref: '#/components/schemas/Cycle'
 *                     stats:
 *                       type: object
 *                       properties:
 *                         sbuSnapshots:
 *                           type: integer
 *                         brandSnapshots:
 *                           type: integer
 *                         clientSnapshots:
 *                           type: integer
 *                         responsesUpdated:
 *                           type: integer
 *       400:
 *         description: Invalid cycle ID
 *       404:
 *         description: Cycle not found
 *       409:
 *         description: Cycle already finalized (use force=true to override)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Cycle already finalized"
 *               message: "Cycle 5 - 2025 has already been finalized. Use ?force=true to re-finalize."
 *       500:
 *         description: Server error
 */
router.post('/cycles/:cycleId/finalize', finalizeCycle);

export default router;
