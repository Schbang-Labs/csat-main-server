/**
 * Admin Controller
 * Handles HTTP requests for admin CRUD operations
 * Business logic delegated to admin.service.js
 */

import * as AdminService from '../../services/admin/admin.service.js';

// ============================================
// SBU Controllers
// ============================================

/**
 * Create a new SBU
 * POST /api/v1/admin/sbu
 */
export const createSBU = async (req, res) => {
  try {
    const sbu = await AdminService.createSBU(req.body);

    res.status(201).json({
      success: true,
      message: 'SBU created successfully',
      data: sbu,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update an SBU
 * PUT /api/v1/admin/sbu/:id
 */
export const updateSBU = async (req, res) => {
  try {
    const { id } = req.params;
    const { sbu, historyCreated } = await AdminService.updateSBU(id, req.body);

    res.json({
      success: true,
      message: 'SBU updated successfully',
      data: sbu,
      historyCreated,
    });
  } catch (error) {
    const status = error.message === 'SBU not found' ? 404 : 400;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all SBUs with pagination and search
 * GET /api/v1/admin/sbus
 * Query params: search (optional), page (default: 1), limit (default: 10, 0 for all)
 */
export const getAllSBUs = async (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const result = await AdminService.getAllSBUs({ search, page, limit });

    res.json({
      success: true,
      count: result.data.length,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      limit: result.limit,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get SBU by ID
 * GET /api/v1/admin/sbu/:id
 */
export const getSBUById = async (req, res) => {
  try {
    const { id } = req.params;
    const { cycleId } = req.query;

    const { data, isHistorical } = await AdminService.getSBUById(id, cycleId);

    res.json({
      success: true,
      isHistorical,
      data,
    });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get SBU history
 * GET /api/v1/admin/sbu/:id/history
 */
export const getSBUHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await AdminService.getSBUHistory(id);

    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// Client Controllers
// ============================================

/**
 * Create a new Client
 * POST /api/v1/admin/client
 */
export const createClient = async (req, res) => {
  try {
    const client = await AdminService.createClient(req.body);

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: client,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update a Client
 * PUT /api/v1/admin/client/:id
 */
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await AdminService.updateClient(id, req.body);

    res.json({
      success: true,
      message: 'Client updated successfully',
      data: client,
    });
  } catch (error) {
    const status = error.message === 'Client not found' ? 404 : 400;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all Clients with pagination and search
 * GET /api/v1/admin/clients
 * Query params: search (optional), brandId (optional), page (default: 1), limit (default: 10, 0 for all)
 */
export const getAllClients = async (req, res) => {
  try {
    const { search, brandId, page, limit } = req.query;
    const result = await AdminService.getAllClients(
      { search, brandId },
      { page, limit }
    );

    res.json({
      success: true,
      count: result.data.length,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      limit: result.limit,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get Client by ID
 * GET /api/v1/admin/client/:id
 */
export const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const { cycleId } = req.query;

    const { data, isHistorical } = await AdminService.getClientById(
      id,
      cycleId
    );

    res.json({
      success: true,
      isHistorical,
      data,
    });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get Client history
 * GET /api/v1/admin/client/:id/history
 */
export const getClientHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await AdminService.getClientHistory(id);

    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// Brand Controllers
// ============================================

/**
 * Create a new Brand
 * POST /api/v1/admin/brand
 */
export const createBrand = async (req, res) => {

  console.log('🔴 POST /brands hit');
  try {
    const brand = await AdminService.createBrand(req.body);

    console.log("brand created successfully in controller", brand);

    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      data: brand,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update a Brand
 * PUT /api/v1/admin/brand/:id
 */
export const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await AdminService.updateBrand(id, req.body);

    res.json({
      success: true,
      message: 'Brand updated successfully',
      data: brand,
    });
  } catch (error) {
    const status = error.message === 'Brand not found' ? 404 : 400;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all Brands with pagination and search
 * GET /api/v1/admin/brands
 * Query params: search (optional), department, sbuId (optional filters), page (default: 1), limit (default: 10, 0 for all)
 */
export const getAllBrands = async (req, res) => {
  try {
    const { search, department, sbuId, page, limit } = req.query;
    const result = await AdminService.getAllBrands(
      { search, department, sbuId },
      { page, limit }
    );

    res.json({
      success: true,
      count: result.data.length,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      limit: result.limit,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get Brand by ID
 * GET /api/v1/admin/brand/:id
 */
export const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;
    const { cycleId } = req.query;

    const { data, isHistorical } = await AdminService.getBrandById(id, cycleId);

    res.json({
      success: true,
      isHistorical,
      data,
    });
  } catch (error) {
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get Brand history
 * GET /api/v1/admin/brand/:id/history
 */
export const getBrandHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await AdminService.getBrandHistory(id);

    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update Brand POCs
 * PUT /api/v1/admin/brand/:id/pocs
 */
export const updateBrandPocs = async (req, res) => {
  try {
    const { id } = req.params;
    const { pocs } = req.body;

    const brand = await AdminService.updateBrandPocs(id, pocs);

    res.json({
      success: true,
      message: 'Brand POCs updated successfully',
      data: brand,
    });
  } catch (error) {
    const status = error.message === 'Brand not found' ? 404 : 400;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// Cycle Management Controllers
// ============================================

/**
 * Finalize a cycle - create history snapshots and update CSAT responses
 * POST /api/v1/admin/cycles/:cycleId/finalize
 *
 * Query Parameters:
 * - force: boolean (optional) - Set to 'true' to re-finalize an already finalized cycle
 *
 * Body Parameters:
 * - force: boolean (optional) - Set to true to re-finalize an already finalized cycle
 *
 * This endpoint should be called when a cycle ends to:
 * 1. Create BrandHistory, ClientHistory, SBUHistory snapshots
 * 2. Update all CSATResponse documents with history IDs
 * 3. Mark the cycle as completed and finalized
 *
 * IDEMPOTENCY: This endpoint can only be called ONCE per cycle.
 * If called again for the same cycle, returns 409 Conflict UNLESS force=true is passed.
 */
export const finalizeCycle = async (req, res) => {
  try {
    const { cycleId } = req.params;
    // Check for force flag in query string or body
    const forceFromQuery =
      req.query.force === 'true' || req.query.force === true;
    const forceFromBody = req.body?.force === true;
    const force = forceFromQuery || forceFromBody;

    // Import the finalize function
    const { finalizeCycleHistory } = await import(
      '../../services/history.service.js'
    );
    const { Cycle } = await import('../../models/index.js');

    // Verify cycle exists
    const cycle = await Cycle.findById(cycleId);
    if (!cycle) {
      return res.status(404).json({
        success: false,
        message: 'Cycle not found',
      });
    }

    // Check if already finalized (return 409 Conflict unless force is true)
    if (cycle.isFinalized && !force) {
      return res.status(409).json({
        success: false,
        message: `Cycle "${cycle.name}" (${cycle.year}) has already been finalized. To re-finalize, pass force=true in query string or request body.`,
        data: {
          cycle: {
            id: cycle._id,
            name: cycle.name,
            year: cycle.year,
            status: cycle.status,
            isFinalized: cycle.isFinalized,
            finalizedAt: cycle.finalizedAt,
          },
          hint: 'Add ?force=true to the URL or {"force": true} in the request body to re-finalize.',
        },
      });
    }

    // Log if force is being used
    if (force && cycle.isFinalized) {
      console.log(
        `⚠️ Force re-finalization requested for cycle: ${cycle.name} (${cycle.year})`
      );
      console.log(
        `   Previous finalization: ${cycle.finalizedAt?.toISOString()}`
      );
    } else {
      console.log(`\n📅 Finalizing cycle: ${cycle.name} (${cycle.year})`);
    }

    // Run the finalization (pass force flag to allow re-finalization)
    const results = await finalizeCycleHistory(cycleId, { force });

    res.json({
      success: true,
      message:
        force && cycle.isFinalized
          ? `Cycle "${cycle.name}" re-finalized successfully (forced)`
          : `Cycle "${cycle.name}" finalized successfully`,
      data: {
        cycle: {
          id: cycle._id,
          name: cycle.name,
          year: cycle.year,
          status: 'completed',
          isFinalized: true,
          finalizedAt: results.finalizedAt,
        },
        snapshots: results.snapshots,
        updates: results.updates,
        wasForced: force && cycle.isFinalized,
      },
    });
  } catch (error) {
    console.error('Cycle finalization error:', error);

    // Handle specific error for already finalized (in case check was bypassed)
    if (error.message.includes('already been finalized')) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create cycles for a year
 * POST /api/v1/admin/cycles
 *
 * Creates all 6 cycles for the specified year.
 * Each year has 6 cycles from May to December.
 */
export const createCycle = async (req, res) => {
  try {
    const { Cycle } = await import('../../models/index.js');
    const { year } = req.body;

    // Validate year
    if (!year || typeof year !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Year is required and must be a number',
      });
    }

    if (year < 2020 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Year must be between 2020 and 2100',
      });
    }

    // Check if cycles already exist for this year
    const existingCycles = await Cycle.find({ year });
    if (existingCycles.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Cycles for year ${year} already exist`,
        data: {
          existingCycles: existingCycles.map(c => ({
            id: c._id,
            name: c.name,
            cycleNumber: c.cycleNumber,
            status: c.status,
          })),
        },
      });
    }

    // Create all 6 cycles for the year
    const cycles = await Cycle.createYearCycles(year);

    res.status(201).json({
      success: true,
      message: `Created 6 cycles for year ${year}`,
      count: cycles.length,
      data: cycles,
    });
  } catch (error) {
    console.error('Create cycle error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update a cycle
 * PUT /api/v1/admin/cycles/:cycleId
 *
 * Updates cycle status and isActive flag.
 * Valid statuses: 'upcoming', 'active', 'closed', 'completed'
 */
export const updateCycle = async (req, res) => {
  try {
    const { Cycle } = await import('../../models/index.js');
    const { cycleId } = req.params;
    const { status, isActive } = req.body;

    // Find cycle
    const cycle = await Cycle.findById(cycleId);
    if (!cycle) {
      return res.status(404).json({
        success: false,
        message: 'Cycle not found',
      });
    }

    const updates = {};
    const validStatuses = ['upcoming', 'active', 'closed', 'completed'];

    // Validate and set status
    if (status !== undefined) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
      }
      updates.status = status;
    }

    // Validate and set isActive
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isActive must be a boolean',
        });
      }
      updates.isActive = isActive;
    }

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid update fields provided. Accepted: status, isActive',
      });
    }

    // If setting to active, ensure only one cycle is active
    if (updates.status === 'active') {
      // Deactivate other active cycles
      await Cycle.updateMany(
        { status: 'active', _id: { $ne: cycleId } },
        { $set: { status: 'closed' } }
      );
    }

    // Update the cycle
    const updatedCycle = await Cycle.findByIdAndUpdate(
      cycleId,
      { $set: updates },
      { new: true }
    );

    res.json({
      success: true,
      message: `Cycle "${cycle.name}" (${cycle.year}) updated successfully`,
      data: updatedCycle,
    });
  } catch (error) {
    console.error('Update cycle error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all cycles
 * GET /api/v1/admin/cycles
 */
export const getAllCycles = async (req, res) => {
  try {
    const { Cycle } = await import('../../models/index.js');
    const { year } = req.query;

    const query = year ? { year: parseInt(year) } : {};
    const cycles = await Cycle.find(query).sort({ year: -1, cycleNumber: -1 });

    res.json({
      success: true,
      count: cycles.length,
      data: cycles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
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
};
