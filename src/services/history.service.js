/**
 * History Service
 * Handles creating and managing history snapshots for SBU, Client, and Brand
 * Call these functions when CRUD operations occur or when a new cycle starts
 */

import logger from '#config/logger.js';
import {
  SBUHistory,
  ClientHistory,
  BrandHistory,
  Cycle,
} from '../models/index.js';

/**
 * Get the current active cycle ID
 * @returns {Promise<ObjectId|null>}
 */
export const getCurrentCycleId = async () => {
  const currentCycle = await Cycle.getCurrentCycle();
  return currentCycle?._id || null;
};

/**
 * Create a history snapshot for an SBU
 * Call this when SBU leadership changes or on cycle start
 * @param {Document} sbu - The SBU document
 * @param {ObjectId} cycleId - The cycle ID (optional, defaults to current)
 * @param {string} reason - Reason for snapshot
 */
export const snapshotSBU = async (
  sbu,
  cycleId = null,
  reason = 'leadership_change'
) => {
  const targetCycleId = cycleId || (await getCurrentCycleId());
  if (!targetCycleId) {
    logger.warn('No active cycle found, skipping SBU history snapshot');
    return null;
  }

  return SBUHistory.upsertSnapshot(
    sbu._id,
    targetCycleId,
    {
      executiveVP: sbu.executiveVP,
      associateVP: sbu.associateVP,
      associateVPs: sbu.associateVPs || [],
      creativeDirector: sbu.creativeDirector,
      leadNames: sbu.leadNames || [],
      departmentId: sbu.departmentId,
      brands: sbu.brands || [],
    },
    reason
  );
};

/**
 * Create a history snapshot for a Client
 * Call this when client data or service mapping changes, or on cycle start
 * @param {Document} client - The Client document
 * @param {ObjectId} cycleId - The cycle ID (optional, defaults to current)
 * @param {string} reason - Reason for snapshot
 */
export const snapshotClient = async (
  client,
  cycleId = null,
  reason = 'client_change'
) => {
  const targetCycleId = cycleId || (await getCurrentCycleId());
  if (!targetCycleId) {
    logger.warn('No active cycle found, skipping Client history snapshot');
    return null;
  }

  return ClientHistory.upsertSnapshot(
    client._id,
    targetCycleId,
    {
      brandId: client.brandId,
      name: client.name,
      phone: client.phone,
      email: client.email,
      serviceMapping: client.serviceMapping || [],
    },
    reason
  );
};

/**
 * Create a history snapshot for a Brand
 * Call this when brand services change, or on cycle start
 * POCs are fetched from Client collection via brandId
 * @param {Document} brand - The Brand document (can have pocs populated or not)
 * @param {ObjectId} cycleId - The cycle ID (optional, defaults to current)
 * @param {string} reason - Reason for snapshot
 */
export const snapshotBrand = async (
  brand,
  cycleId = null,
  reason = 'service_change'
) => {
  const targetCycleId = cycleId || (await getCurrentCycleId());
  if (!targetCycleId) {
    logger.warn('No active cycle found, skipping Brand history snapshot');
    return null;
  }

  // Get POC IDs from Client collection if not already populated
  let pocIds = [];
  if (brand.pocs && brand.pocs.length > 0) {
    // If pocs is populated, extract IDs
    pocIds = brand.pocs.map(p => p._id || p);
  } else {
    // Query Client collection for this brand's POCs
    const { Client } = await import('../models/index.js');
    const clients = await Client.find({ brandId: brand._id, isActive: true });
    pocIds = clients.map(c => c._id);
  }

  return BrandHistory.upsertSnapshot(
    brand._id,
    targetCycleId,
    {
      name: brand.name,
      slug: brand.slug,
      secondBrainId: brand.secondBrainId,
      services: brand.services || [],
      pocs: pocIds,
    },
    reason
  );
};

/**
 * Snapshot all entities for a cycle (typically at cycle end)
 * Call this when a cycle is completed to freeze the historical state
 * @param {ObjectId} cycleId - The cycle ID to snapshot
 * @returns {Object} Results with counts and lookup maps
 */
export const snapshotAllForCycle = async cycleId => {
  // Import models dynamically to avoid circular dependencies
  const { SBU, Client, Brand } = await import('../models/index.js');

  const [sbus, clients, brands] = await Promise.all([
    SBU.find({ isActive: true }),
    Client.find({ isActive: true }),
    Brand.find({ isActive: true }).populate('pocs'),
  ]);

  const results = {
    sbus: [],
    clients: [],
    brands: [],
    // Lookup maps: entityId -> historyId
    sbuMap: new Map(),
    clientMap: new Map(),
    brandMap: new Map(),
  };

  // Snapshot all SBUs
  for (const sbu of sbus) {
    try {
      const snapshot = await snapshotSBU(sbu, cycleId, 'cycle_start');
      if (snapshot) {
        results.sbus.push(snapshot);
        results.sbuMap.set(sbu._id.toString(), snapshot._id);
      }
    } catch (err) {
      logger.error(`Failed to snapshot SBU ${sbu._id}`, {
        error: err.message,
        stack: err.stack,
      });
    }
  }

  // Snapshot all Clients
  for (const client of clients) {
    try {
      const snapshot = await snapshotClient(client, cycleId, 'cycle_start');
      if (snapshot) {
        results.clients.push(snapshot);
        results.clientMap.set(client._id.toString(), snapshot._id);
      }
    } catch (err) {
      logger.error(`Failed to snapshot Client ${client._id}`, {
        error: err.message,
        stack: err.stack,
      });
    }
  }

  // Snapshot all Brands
  for (const brand of brands) {
    try {
      const snapshot = await snapshotBrand(brand, cycleId, 'cycle_start');
      if (snapshot) {
        results.brands.push(snapshot);
        results.brandMap.set(brand._id.toString(), snapshot._id);
      }
    } catch (err) {
      logger.error(`Failed to snapshot Brand ${brand._id}`, {
        error: err.message,
        stack: err.stack,
      });
    }
  }

  logger.info(`Cycle ${cycleId} snapshot complete`, {
    sbus: results.sbus.length,
    clients: results.clients.length,
    brands: results.brands.length,
  });

  return results;
};

/**
 * Update all CSATResponse documents for a cycle with history IDs
 * Call this after snapshotAllForCycle to link responses to their history snapshots
 * @param {ObjectId} cycleId - The cycle ID
 * @returns {Object} Update results with counts
 */
export const updateCSATResponseHistoryIds = async cycleId => {
  const { CSATResponse } = await import('../models/index.js');

  // Get all history records for this cycle
  const [sbuHistories, clientHistories, brandHistories] = await Promise.all([
    SBUHistory.find({ cycleId }),
    ClientHistory.find({ cycleId }),
    BrandHistory.find({ cycleId }),
  ]);

  // Build lookup maps: entityId -> historyId
  const sbuMap = new Map();
  sbuHistories.forEach(h => sbuMap.set(h.sbuId.toString(), h._id));

  const clientMap = new Map();
  clientHistories.forEach(h => clientMap.set(h.clientId.toString(), h._id));

  const brandMap = new Map();
  brandHistories.forEach(h => brandMap.set(h.brandId.toString(), h._id));

  logger.info('Fetched history records for cycle', {
    cycleId,
    sbus: sbuHistories.length,
    clients: clientHistories.length,
    brands: brandHistories.length,
  });

  // Get all CSATResponses for this cycle that don't have history IDs yet
  const responses = await CSATResponse.find({
    cycleId,
    $or: [
      { brandHistoryId: null },
      { clientHistoryId: null },
      { sbuHistoryId: null },
    ],
  });

  logger.info('Fetched CSAT responses for history updates', {
    cycleId,
    count: responses.length,
  });

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const response of responses) {
    try {
      const updates = {};
      let hasUpdates = false;

      // Get history IDs from maps
      if (!response.brandHistoryId && response.brandId) {
        const brandHistoryId = brandMap.get(response.brandId.toString());
        if (brandHistoryId) {
          updates.brandHistoryId = brandHistoryId;
          hasUpdates = true;
        }
      }

      if (!response.clientHistoryId && response.clientId) {
        const clientHistoryId = clientMap.get(response.clientId.toString());
        if (clientHistoryId) {
          updates.clientHistoryId = clientHistoryId;
          hasUpdates = true;
        }
      }

      if (!response.sbuHistoryId && response.sbuId) {
        const sbuHistoryId = sbuMap.get(response.sbuId.toString());
        if (sbuHistoryId) {
          updates.sbuHistoryId = sbuHistoryId;
          hasUpdates = true;
        }
      }

      if (hasUpdates) {
        await CSATResponse.findByIdAndUpdate(response._id, updates);
        updated++;
      } else {
        skipped++;
      }
    } catch (err) {
      logger.error(`Failed to update response ${response._id}`, {
        error: err.message,
        stack: err.stack,
      });
      errors++;
    }
  }

  const result = {
    totalResponses: responses.length,
    updated,
    skipped,
    errors,
    historyRecords: {
      sbus: sbuHistories.length,
      clients: clientHistories.length,
      brands: brandHistories.length,
    },
  };

  logger.info('CSAT response history IDs update complete', result);
  return result;
};

/**
 * Complete cycle end snapshot process
 * Creates all history snapshots AND updates CSAT responses with history IDs
 *
 * IDEMPOTENCY: This function can only be called ONCE per cycle by default.
 * If the cycle is already finalized, an error is thrown UNLESS force=true.
 *
 * @param {ObjectId} cycleId - The cycle ID to finalize
 * @param {Object} options - Options object
 * @param {boolean} options.force - If true, allows re-finalization of already finalized cycles
 * @returns {Object} Combined results
 * @throws {Error} If cycle is already finalized (and force is false) or not found
 */
export const finalizeCycleHistory = async (cycleId, options = {}) => {
  const { force = false } = options;
  const { Cycle } = await import('../models/index.js');

  // Step 0: Check if cycle exists and is not already finalized (unless force is true)
  const cycle = await Cycle.findById(cycleId);

  if (!cycle) {
    throw new Error(`Cycle not found: ${cycleId}`);
  }

  if (cycle.isFinalized && !force) {
    throw new Error(
      `Cycle ${cycle.name} (${cycle.year}) has already been finalized on ${cycle.finalizedAt?.toISOString()}. ` +
        'Finalization can only be performed once per cycle. Pass { force: true } to re-finalize.'
    );
  }

  // Log if force re-finalization is happening
  if (cycle.isFinalized && force) {
    logger.warn('Force re-finalization requested for cycle', {
      cycleId,
      cycleName: cycle.name,
      cycleYear: cycle.year,
      previousFinalizedAt: cycle.finalizedAt?.toISOString() || null,
    });
  }

  logger.info('Starting cycle history finalization', {
    cycleId,
    cycleName: cycle.name,
    cycleYear: cycle.year,
    force,
  });

  // Step 1: Create snapshots for all entities
  logger.info('Cycle finalization step started', {
    cycleId,
    step: 'create_history_snapshots',
  });
  const snapshotResults = await snapshotAllForCycle(cycleId);

  // Step 2: Update CSAT responses with history IDs
  logger.info('Cycle finalization step started', {
    cycleId,
    step: 'update_csat_history_ids',
  });
  const updateResults = await updateCSATResponseHistoryIds(cycleId);

  // Step 3: Mark cycle as finalized and completed
  await Cycle.findByIdAndUpdate(cycleId, {
    status: 'completed',
    isActive: false,
    isFinalized: true,
    finalizedAt: new Date(),
  });
  logger.info('Cycle finalization step completed', {
    cycleId,
    step: 'mark_cycle_finalized',
  });

  return {
    cycleId,
    cycleName: cycle.name,
    cycleYear: cycle.year,
    finalizedAt: new Date().toISOString(),
    snapshots: {
      sbus: snapshotResults.sbus.length,
      clients: snapshotResults.clients.length,
      brands: snapshotResults.brands.length,
    },
    updates: updateResults,
  };
};

/**
 * Get SBU data for a specific cycle (historical or current)
 * @param {ObjectId} sbuId
 * @param {ObjectId} cycleId - If null, returns current data
 */
export const getSbuForCycle = async (sbuId, cycleId = null) => {
  if (!cycleId) {
    const { SBU } = await import('../models/index.js');
    return SBU.findById(sbuId).populate('departmentId brands');
  }
  return SBUHistory.getByCycle(sbuId, cycleId);
};

/**
 * Get Client data for a specific cycle (historical or current)
 * @param {ObjectId} clientId
 * @param {ObjectId} cycleId - If null, returns current data
 */
export const getClientForCycle = async (clientId, cycleId = null) => {
  if (!cycleId) {
    const { Client } = await import('../models/index.js');
    return Client.findById(clientId).populate('brandId');
  }
  return ClientHistory.getByCycle(clientId, cycleId);
};

/**
 * Get Brand data for a specific cycle (historical or current)
 * @param {ObjectId} brandId
 * @param {ObjectId} cycleId - If null, returns current data
 */
export const getBrandForCycle = async (brandId, cycleId = null) => {
  if (!cycleId) {
    const { Brand } = await import('../models/index.js');
    return Brand.findById(brandId).populate('services.sbuId pocs');
  }
  return BrandHistory.getByCycle(brandId, cycleId);
};

/**
 * Get all POCs for a brand at a specific cycle
 * @param {ObjectId} brandId
 * @param {ObjectId} cycleId - If null, returns current POCs
 */
export const getBrandPocsForCycle = async (brandId, cycleId = null) => {
  if (!cycleId) {
    const { Brand } = await import('../models/index.js');
    const brand = await Brand.findById(brandId).populate('pocs');
    return brand?.pocs || [];
  }

  const brandHistory = await BrandHistory.getByCycle(brandId, cycleId);
  if (!brandHistory) return [];

  const { Client } = await import('../models/index.js');
  return Client.find({ _id: { $in: brandHistory.pocs } });
};

export default {
  getCurrentCycleId,
  snapshotSBU,
  snapshotClient,
  snapshotBrand,
  snapshotAllForCycle,
  updateCSATResponseHistoryIds,
  finalizeCycleHistory,
  getSbuForCycle,
  getClientForCycle,
  getBrandForCycle,
  getBrandPocsForCycle,
};
