/**
 * Dashboard Service Helper Functions
 * Utility functions for CSAT dashboard data processing and aggregation
 */

import mongoose from 'mongoose';
import { Cycle } from '../../models/index.js';

const toObjectIdsSafe = values =>
  Array.isArray(values)
    ? values
      .map(value => {
        try {
          return new mongoose.Types.ObjectId(value);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
    : [];

const resolveScopeIds = (singleId, multipleIds = []) =>
  [...new Set((singleId ? [singleId] : Array.isArray(multipleIds) ? multipleIds : [])
    .map(id => (id ? String(id).trim() : null))
    .filter(Boolean))];

/**
 * Build MongoDB match filter from query params
 * @param {Object} params - Filter parameters
 * @returns {Object} MongoDB match filter
 */
export const buildFilter = params => {
  const filter = { isValid: true };

  if (params.departmentId) {
    filter.departmentId = new mongoose.Types.ObjectId(params.departmentId);
  } else if (Array.isArray(params.departmentIds) && params.departmentIds.length) {
    const scopedDepartmentObjectIds = toObjectIdsSafe(params.departmentIds);
    if (scopedDepartmentObjectIds.length > 0) {
      filter.departmentId = { $in: scopedDepartmentObjectIds };
    }
  }
  if (params.brandId) {
    filter.brandId = new mongoose.Types.ObjectId(params.brandId);
  }
  if (params.cycleId) {
    filter.cycleId = new mongoose.Types.ObjectId(params.cycleId);
  }
  if (params.sbuId) {
    filter.sbuId = new mongoose.Types.ObjectId(params.sbuId);
  } else if (Array.isArray(params.sbuIds) && params.sbuIds.length) {
    const scopedSbuObjectIds = toObjectIdsSafe(params.sbuIds);
    if (scopedSbuObjectIds.length > 0) {
      filter.sbuId = { $in: scopedSbuObjectIds };
    }
  }

  return filter;
};

/**
 * Build filter with year support
 * If year is provided without cycleId, finds all cycles for that year
 * @param {Object} params - Filter parameters
 * @returns {Promise<Object>} MongoDB match filter
 */
export const buildFilterWithYear = async params => {
  const filter = { isValid: true };

  if (params.departmentId) {
    filter.departmentId = new mongoose.Types.ObjectId(params.departmentId);
  } else if (Array.isArray(params.departmentIds) && params.departmentIds.length) {
    const scopedDepartmentObjectIds = toObjectIdsSafe(params.departmentIds);
    if (scopedDepartmentObjectIds.length > 0) {
      filter.departmentId = { $in: scopedDepartmentObjectIds };
    }
  }
  if (params.brandId) {
    filter.brandId = new mongoose.Types.ObjectId(params.brandId);
  }
  if (params.sbuId) {
    filter.sbuId = new mongoose.Types.ObjectId(params.sbuId);
  } else if (Array.isArray(params.sbuIds) && params.sbuIds.length) {
    const scopedSbuObjectIds = toObjectIdsSafe(params.sbuIds);
    if (scopedSbuObjectIds.length > 0) {
      filter.sbuId = { $in: scopedSbuObjectIds };
    }
  }

  // Handle year filter - find all cycles for that year
  if (params.year && !params.cycleId) {
    const yearCycles = await Cycle.find({ year: parseInt(params.year) }).select(
      '_id'
    );
    filter.cycleId = { $in: yearCycles.map(c => c._id) };
  } else if (params.cycleId) {
    filter.cycleId = new mongoose.Types.ObjectId(params.cycleId);
  }

  return filter;
};

/**
 * Calculate pagination parameters
 * @param {number|string} page - Page number (1-indexed)
 * @param {number|string} limit - Items per page
 * @returns {Object} { skip, limit, page }
 */
export const calculatePagination = (page = 1, limit = 50) => {
  const parsedPage = parseInt(page) || 1;
  // Handle limit=0 as "no limit" for exports
  // parseInt(0) returns 0 which is falsy, so check explicitly for null/undefined
  const parsedLimit = limit === 0 || limit === '0' ? 0 : parseInt(limit) || 50;
  const skip = (parsedPage - 1) * parsedLimit;

  return {
    skip,
    limit: parsedLimit,
    page: parsedPage,
  };
};

/**
 * Build pagination response object
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items count
 * @returns {Object} Pagination response
 */
export const buildPaginationResponse = (page, limit, total) => ({
  page: parseInt(page),
  limit: parseInt(limit),
  total,
  pages: Math.ceil(total / parseInt(limit)),
  hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
  hasPrev: parseInt(page) > 1,
});

/**
 * Classify satisfaction score
 * @param {number} score - Satisfaction score (0-5)
 * @returns {string} Classification label
 */
export const classifyScore = score => {
  if (score >= 4) return 'excellent';
  if (score >= 3) return 'good';
  if (score >= 2) return 'average';
  return 'critical';
};

/**
 * Get color code for classification
 * @param {string} classification - Classification label
 * @returns {string} HEX color code
 */
export const getClassificationColor = classification => {
  const colors = {
    excellent: '#22c55e', // Green
    good: '#84cc16', // Lime
    average: '#eab308', // Yellow
    critical: '#ef4444', // Red
  };
  return colors[classification] || '#6b7280'; // Gray default
};

/**
 * Calculate NPS category from score
 * @param {number} score - Likelihood to recommend (0-5)
 * @returns {string} NPS category (promoter, passive, detractor)
 */
export const getNPSCategory = score => {
  if (score >= 4) return 'promoter';
  if (score >= 3) return 'passive';
  return 'detractor';
};

/**
 * CSAT Classification Thresholds
 * Used for classifying responses based on CSAT score
 * 
 * Good → CSAT ≥ 3.75
 * Average → CSAT ≥ 3.0 and < 3.75
 * Critical → CSAT < 3.0
 */
export const CSAT_CLASSIFICATION = {
  GOOD: { min: 3.75, max: Infinity, label: 'good' },
  AVERAGE: { min: 3.0, max: 3.75, label: 'average' },
  CRITICAL: { min: -Infinity, max: 3.0, label: 'critical' },
};

/**
 * Get classification label from CSAT score
 * @param {number} csatScore - CSAT score
 * @returns {string} Classification label: 'good', 'average', or 'critical'
 */
export const getCSATClassification = csatScore => {
  if (csatScore >= CSAT_CLASSIFICATION.GOOD.min) return 'good';
  if (csatScore >= CSAT_CLASSIFICATION.AVERAGE.min) return 'average';
  return 'critical';
};

/**
 * Validate classification parameter
 * @param {string} classification - Classification value from query param
 * @returns {boolean} True if valid classification
 */
export const isValidClassification = classification => {
  return ['good', 'average', 'critical'].includes(classification?.toLowerCase());
};

/**
 * Calculate percentage change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number|null} Percentage change or null if previous is 0
 */
export const calculateChange = (current, previous) => {
  if (!previous || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100 * 100) / 100;
};

/**
 * Format score for display
 * @param {number} score - Raw score
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted score
 */
export const formatScore = (score, decimals = 2) => {
  if (score === null || score === undefined) return 'N/A';
  return Number(score).toFixed(decimals);
};

/**
 * Calculate CSAT and NPS averages from response data
 * CSAT = Average of all metrics EXCEPT likelihoodToRecommend
 * NPS = Average of likelihoodToRecommend
 *
 * @param {Object} responseData - The data field from CSAT response
 * @returns {Object} { csatScore, npsScore, metricsCount }
 */
export const calculateResponseScores = responseData => {
  if (!responseData) return { csatScore: 0, npsScore: 0, metricsCount: 0 };

  const scores = [];
  let npsScore = 0;

  // Extract coreMetrics
  if (responseData.coreMetrics) {
    Object.entries(responseData.coreMetrics).forEach(([key, value]) => {
      if (typeof value === 'number' && value > 0) {
        if (key === 'likelihoodToRecommend') {
          npsScore = value;
        } else if (key === 'workAgainLikelihood' && npsScore === 0) {
          // For SMP department, use workAgainLikelihood as NPS when likelihoodToRecommend is not present
          npsScore = value;
        } else {
          scores.push(value);
        }
      }
    });
  }

  // Extract deliveryMetrics
  if (responseData.deliveryMetrics) {
    Object.values(responseData.deliveryMetrics).forEach(value => {
      if (typeof value === 'number' && value > 0) {
        scores.push(value);
      }
    });
  }

  // Extract qualityEvaluation (only if values > 0)
  if (responseData.qualityEvaluation) {
    Object.values(responseData.qualityEvaluation).forEach(value => {
      if (typeof value === 'number' && value > 0) {
        scores.push(value);
      }
    });
  }

  const csatScore =
    scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : 0;

  return {
    csatScore: Math.round(csatScore * 100) / 100,
    npsScore,
    metricsCount: scores.length,
  };
};

/**
 * Calculate aggregate CSAT and NPS from array of responses
 * @param {Array} responses - Array of CSAT response documents with data field
 * @returns {Object} { avgCSAT, avgNPS, totalResponses }
 */
export const calculateAggregateScores = responses => {
  if (!responses || responses.length === 0) {
    return { avgCSAT: 0, avgNPS: 0, totalResponses: 0 };
  }

  let totalCSAT = 0;
  let totalNPS = 0;
  let csatCount = 0;
  let npsCount = 0;

  responses.forEach(response => {
    const { csatScore, npsScore, metricsCount } = calculateResponseScores(
      response.data
    );
    if (metricsCount > 0) {
      totalCSAT += csatScore;
      csatCount++;
    }
    if (npsScore > 0) {
      totalNPS += npsScore;
      npsCount++;
    }
  });

  return {
    avgCSAT:
      csatCount > 0 ? Math.round((totalCSAT / csatCount) * 100) / 100 : 0,
    avgNPS: npsCount > 0 ? Math.round((totalNPS / npsCount) * 100) / 100 : 0,
    totalResponses: responses.length,
  };
};

/**
 * Calculate fill rate statistics for brands and POCs
 * For historical cycles, uses BrandHistory/ClientHistory to get accurate mappings
 * For current cycle, uses live Brand/Client data
 * 
 * @param {Object} params - Filter parameters
 * @param {string} params.departmentId - Department ObjectId (optional)
 * @param {string[]} params.departmentIds - Department ObjectIds (optional)
 * @param {string} params.sbuId - SBU ObjectId (optional)
 * @param {string[]} params.sbuIds - SBU ObjectIds (optional)
 * @param {string} params.cycleId - Cycle ObjectId (optional)
 * @param {number} params.year - Year filter (optional)
 * @returns {Promise<Object>} Fill rate statistics
 */
export const calculateFillRates = async (params = {}) => {
  const {
    departmentId,
    departmentIds = [],
    sbuId,
    sbuIds = [],
    cycleId,
    year,
  } = params;
  const scopedDepartmentIds = resolveScopeIds(departmentId, departmentIds);
  const scopedSbuIds = resolveScopeIds(sbuId, sbuIds);
  const scopedDepartmentObjectIds = toObjectIdsSafe(scopedDepartmentIds);
  const scopedSbuObjectIds = toObjectIdsSafe(scopedSbuIds);
  const hasDepartmentScope = scopedDepartmentIds.length > 0;
  const hasSbuScope = scopedSbuIds.length > 0;

  // Import models dynamically to avoid circular deps
  const { CSATResponse, Brand, Client, Department, SBU, SBUHistory, BrandHistory, ClientHistory } = await import(
    '../../models/index.js'
  );

  const [scopedDepartments, scopedSBUs] = await Promise.all([
    scopedDepartmentObjectIds.length > 0
      ? Department.find({ _id: { $in: scopedDepartmentObjectIds } })
        .select('name displayName')
        .lean()
      : [],
    scopedSbuObjectIds.length > 0
      ? SBU.find({ _id: { $in: scopedSbuObjectIds } })
        .select('name brands departmentId')
        .lean()
      : [],
  ]);

  const scopedDepartmentCodes = scopedDepartments
    .map(dept => dept.name)
    .filter(Boolean);
  const scopedDepartmentNames = scopedDepartments
    .map(dept => dept.displayName || dept.name)
    .filter(Boolean);
  const scopedSbuNames = scopedSBUs.map(sbu => sbu.name).filter(Boolean);
  const scopedSbuBrandIds = toObjectIdsSafe([
    ...new Set(
      scopedSBUs
        .flatMap(sbu => sbu.brands || [])
        .map(brandId => String(brandId))
    ),
  ]);

  // Build response filter for counting filled responses
  const responseFilter = await buildFilterWithYear({
    cycleId,
    year,
    departmentId,
    departmentIds: scopedDepartmentIds,
    sbuId,
    sbuIds: scopedSbuIds,
  });

  // Get all brands that have submitted CSAT
  const filledBrandIds = await CSATResponse.distinct('brandId', responseFilter);

  // Get all unique POCs (clients) who filled CSAT
  const filledClientIds = await CSATResponse.distinct(
    'clientId',
    responseFilter
  );
  const totalPOCsFilled = filledClientIds.length;
  const totalBrandsFilled = filledBrandIds.length;

  // Determine if we should use historical data
  // Use historical data when a specific cycleId is provided and it's not the current cycle
  const isCurrent = cycleId ? await isCurrentCycle(cycleId) : true;
  const useHistoricalData = Boolean(cycleId) && !isCurrent;

  let totalMappedBrands = 0;
  let totalPOCs = 0;

  if (useHistoricalData) {
    // For historical cycles: use BrandHistory and ClientHistory
    const cycleObjectId = new mongoose.Types.ObjectId(cycleId);

    // Build BrandHistory query scoped to department/SBU access
    const brandHistoryQuery = { cycleId: cycleObjectId };
    const serviceScopeMatch = {};
    if (scopedDepartmentCodes.length > 0) {
      serviceScopeMatch.department = { $in: scopedDepartmentCodes };
    }
    if (scopedSbuObjectIds.length > 0) {
      serviceScopeMatch.sbuId = { $in: scopedSbuObjectIds };
      serviceScopeMatch.isActive = true;
    }
    if (Object.keys(serviceScopeMatch).length > 0) {
      brandHistoryQuery.services = { $elemMatch: serviceScopeMatch };
    }

    const scopedBrandHistories = await BrandHistory.find(brandHistoryQuery)
      .select('brandId')
      .lean();

    const scopedHistoricalBrandIdSet = new Set(
      scopedBrandHistories
        .map(history => (history.brandId ? String(history.brandId) : null))
        .filter(Boolean)
    );

    // Historical SBU snapshots can have more reliable brand mappings than service-level history.
    // Use them as fallback/support for SBU-scoped calculations.
    if (hasSbuScope) {
      const sbuHistoryQuery = {
        cycleId: cycleObjectId,
        sbuId: { $in: scopedSbuObjectIds },
      };
      if (scopedDepartmentObjectIds.length > 0) {
        sbuHistoryQuery.departmentId = { $in: scopedDepartmentObjectIds };
      }

      const scopedSbuHistories = await SBUHistory.find(sbuHistoryQuery)
        .select('brands')
        .lean();

      scopedSbuHistories.forEach(history => {
        (history.brands || []).forEach(brandId => {
          if (brandId) {
            scopedHistoricalBrandIdSet.add(String(brandId));
          }
        });
      });
    }

    // Last-resort fallback: if responses exist in this scoped filter, include those brands
    // to avoid impossible states like totalMappedBrands=0 but totalBrandsFilled>0.
    if (scopedHistoricalBrandIdSet.size === 0 && filledBrandIds.length > 0) {
      filledBrandIds.forEach(brandId => {
        if (brandId) {
          scopedHistoricalBrandIdSet.add(String(brandId));
        }
      });
    }

    const scopedHistoricalBrandIds = toObjectIdsSafe(
      [...scopedHistoricalBrandIdSet]
    );

    // Build query for ClientHistory using scoped historical brands and departments
    const clientHistoryQuery = { cycleId: cycleObjectId };
    if (scopedHistoricalBrandIds.length > 0) {
      clientHistoryQuery.brandId = { $in: scopedHistoricalBrandIds };
    }
    if (scopedDepartmentCodes.length > 0) {
      clientHistoryQuery.serviceMapping = {
        $elemMatch: {
          department: { $in: scopedDepartmentCodes },
          isActive: true,
        },
      };
    }

    // Count from historical data
    totalMappedBrands = scopedHistoricalBrandIds.length;
    if ((hasSbuScope || hasDepartmentScope) && scopedHistoricalBrandIds.length === 0) {
      totalPOCs = 0;
    } else {
      totalPOCs = await ClientHistory.countDocuments(clientHistoryQuery);
    }
  } else {
    // For current cycle or no specific cycle: use live Brand/Client data
    const brandQuery = { isActive: true };
    if (scopedDepartmentCodes.length > 0) {
      brandQuery['services.department'] = { $in: scopedDepartmentCodes };
    }
    if (hasSbuScope) {
      brandQuery._id = { $in: scopedSbuBrandIds };
    }

    const clientQuery = { isActive: true };
    if (scopedDepartmentCodes.length > 0) {
      clientQuery['serviceMapping.department'] = { $in: scopedDepartmentCodes };
    }
    if (hasSbuScope) {
      clientQuery.brandId = { $in: scopedSbuBrandIds };
    }

    const [brandCount, clientCount] = await Promise.all([
      Brand.countDocuments(brandQuery),
      Client.countDocuments(clientQuery),
    ]);

    totalMappedBrands = brandCount;
    totalPOCs = clientCount;
  }

  const totalBrandsUnfilled = Math.max(
    0,
    totalMappedBrands - totalBrandsFilled
  );
  const totalPOCsUnfilled = Math.max(0, totalPOCs - totalPOCsFilled);

  return {
    departmentFilter:
      scopedDepartmentNames.length > 0
        ? scopedDepartmentNames.join(', ')
        : 'all',
    sbuFilter: scopedSbuNames.length > 0 ? scopedSbuNames.join(', ') : 'all',
    totalMappedBrands,
    totalBrandsFilled,
    totalBrandsUnfilled,
    totalPOCs,
    totalPOCsFilled,
    totalPOCsUnfilled,
    brandFillRate:
      totalMappedBrands > 0
        ? Math.round((totalBrandsFilled / totalMappedBrands) * 100 * 100) / 100
        : 0,
    pocFillRate:
      totalPOCs > 0
        ? Math.round((totalPOCsFilled / totalPOCs) * 100 * 100) / 100
        : 0,
  };
};

/**
 * Get date range for a specific cycle
 * @param {number} year - Year
 * @param {number} cycleNumber - Cycle number (1-6)
 * @returns {Object|null} { startDate, endDate }
 */
export const getCycleDateRange = (year, cycleNumber) => {
  const cycleConfig = {
    1: { months: [4] }, // May
    2: { months: [5, 6] }, // June-July
    3: { months: [7] }, // August
    4: { months: [8, 9] }, // September-October
    5: { months: [10] }, // November
    6: { months: [11] }, // December
  };

  const config = cycleConfig[cycleNumber];
  if (!config) return null;

  const startDate = new Date(year, config.months[0], 1);
  const endMonth = config.months[config.months.length - 1];
  const endDate = new Date(year, endMonth + 1, 0, 23, 59, 59, 999);

  return { startDate, endDate };
};

/**
 * Create ObjectId from string (with validation)
 * @param {string} id - String ID
 * @returns {ObjectId|null} MongoDB ObjectId or null if invalid
 */
export const toObjectId = id => {
  if (!id) return null;
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
};

/**
 * Validate ObjectId string
 * @param {string} id - String to validate
 * @returns {boolean} True if valid ObjectId
 */
export const isValidObjectId = id => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Standard population fields for responses (minimal)
 */
export const RESPONSE_POPULATIONS = {
  brand: { path: 'brandId', select: 'name slug' },
  client: { path: 'clientId', select: 'name phone email' },
  department: { path: 'departmentId', select: 'name displayName' },
  cycle: { path: 'cycleId', select: 'name cycleNumber year' },
  sbu: {
    path: 'sbuId',
    select:
      'name slug executiveVP associateVP associateVPs creativeDirector leadNames',
  },
};

/**
 * Standard population fields for detailed response (all fields)
 */
export const RESPONSE_POPULATIONS_DETAILED = {
  brand: { path: 'brandId', select: 'name slug services secondBrainId' },
  client: {
    path: 'clientId',
    select: 'name phone email serviceMapping brandId',
  },
  department: {
    path: 'departmentId',
    select: 'name displayName description hasSBUs',
  },
  cycle: {
    path: 'cycleId',
    select: 'name cycleNumber year startDate endDate status',
  },
  sbu: {
    path: 'sbuId',
    select:
      'name slug departmentId executiveVP associateVP associateVPs creativeDirector leadNames brands',
  },
};

/**
 * Enrich a single response with calculated CSAT and NPS scores
 * @param {Object} response - CSAT response document (can be mongoose doc or plain object)
 * @returns {Object} Response with csat and nps fields added
 */
export const enrichResponseWithScores = response => {
  if (!response) return null;

  // Convert mongoose document to plain object if needed
  const obj = response.toObject ? response.toObject() : { ...response };

  // Calculate CSAT and NPS from response data
  const { csatScore, npsScore } = calculateResponseScores(obj.data);

  // Add calculated fields
  obj.csat = csatScore;
  obj.nps = npsScore;

  return obj;
};

/**
 * Enrich array of responses with calculated CSAT and NPS scores
 * @param {Array} responses - Array of CSAT response documents
 * @returns {Array} Responses with csat and nps fields added
 */
export const enrichResponsesWithScores = responses => {
  if (!responses || !Array.isArray(responses)) return [];
  return responses.map(enrichResponseWithScores);
};

/**
 * Check if a cycle should use historical snapshots.
 * Historical models are used only when cycle is finalized and closed/completed.
 * Ongoing cycle is identified as: status=active and isFinalized=true.
 * @param {ObjectId|string} cycleId - Cycle ID to check
 * @returns {Promise<boolean>} True if historical models should be used
 */
export const isHistoricalCycle = async cycleId => {
  if (!cycleId) return false;

  const cycle = await Cycle.findById(cycleId)
    .select('status isFinalized')
    .lean();
  if (!cycle) return false;

  const cycleStatus = String(cycle.status || '').toLowerCase();
  return (
    cycle.isFinalized === true &&
    ['closed', 'completed'].includes(cycleStatus)
  );
};

/**
 * Check if a cycle should use current/live models.
 * Ongoing cycle is explicitly identified as:
 * - status = active
 * - isFinalized = true
 *
 * For all non-historical states, current/live models are used.
 * @param {ObjectId|string} cycleId - Cycle ID to check
 * @returns {Promise<boolean>} True if current models should be used
 */
export const isCurrentCycle = async cycleId => {
  if (!cycleId) return true;

  const cycle = await Cycle.findById(cycleId)
    .select('status isFinalized')
    .lean();
  if (!cycle) return true;

  const cycleStatus = String(cycle.status || '').toLowerCase();
  const isOngoingCycle =
    cycle.isFinalized === true && cycleStatus === 'active';

  if (isOngoingCycle) {
    return true;
  }

  const isHistoricalSnapshot =
    cycle.isFinalized === true &&
    ['closed', 'completed'].includes(cycleStatus);

  return !isHistoricalSnapshot;
};

/**
 * Enrich responses with historical SBU, Brand, Client data for older cycles
 * For current cycle, returns responses as-is
 * For older cycles:
 *   - First uses stored historyIds (brandHistoryId, clientHistoryId, sbuHistoryId) if available
 *   - Falls back to lookup by entityId + cycleId for legacy data
 *
 * @param {Array} responses - Array of CSAT response documents with populated fields
 * @param {ObjectId|string} cycleId - Cycle ID to use for historical lookup
 * @returns {Promise<Array>} Responses with historical data enrichment
 */
export const enrichWithHistoricalData = async (responses, cycleId) => {
  if (!responses || !Array.isArray(responses) || responses.length === 0) {
    return responses;
  }

  // If no cycleId or current cycle, return responses as-is (use live data)
  if (!cycleId || (await isCurrentCycle(cycleId))) {
    return responses;
  }

  // Import history models dynamically to avoid circular dependencies
  const { SBUHistory, BrandHistory, ClientHistory } = await import(
    '../../models/index.js'
  );

  // Collect unique IDs for batch fetching
  // Priority 1: Use historyIds directly if available
  // Priority 2: Fall back to entityId + cycleId lookup

  const sbuHistoryIds = [
    ...new Set(
      responses.filter(r => r.sbuHistoryId).map(r => r.sbuHistoryId.toString())
    ),
  ];
  const brandHistoryIds = [
    ...new Set(
      responses
        .filter(r => r.brandHistoryId)
        .map(r => r.brandHistoryId.toString())
    ),
  ];
  const clientHistoryIds = [
    ...new Set(
      responses
        .filter(r => r.clientHistoryId)
        .map(r => r.clientHistoryId.toString())
    ),
  ];

  // For fallback: collect entityIds where historyId is not available
  const sbuIdsForFallback = [
    ...new Set(
      responses
        .filter(r => !r.sbuHistoryId && r.sbuId?._id)
        .map(r => r.sbuId._id.toString())
    ),
  ];
  const brandIdsForFallback = [
    ...new Set(
      responses
        .filter(r => !r.brandHistoryId && r.brandId?._id)
        .map(r => r.brandId._id.toString())
    ),
  ];
  const clientIdsForFallback = [
    ...new Set(
      responses
        .filter(r => !r.clientHistoryId && r.clientId?._id)
        .map(r => r.clientId._id.toString())
    ),
  ];

  // Batch fetch historical data (both by historyId and by entityId+cycleId)
  const [
    sbuHistoriesById,
    brandHistoriesById,
    clientHistoriesById,
    sbuHistoriesByEntity,
    brandHistoriesByEntity,
    clientHistoriesByEntity,
  ] = await Promise.all([
    // Direct historyId lookups
    sbuHistoryIds.length > 0
      ? SBUHistory.find({ _id: { $in: sbuHistoryIds } }).lean()
      : [],
    brandHistoryIds.length > 0
      ? BrandHistory.find({ _id: { $in: brandHistoryIds } }).lean()
      : [],
    clientHistoryIds.length > 0
      ? ClientHistory.find({ _id: { $in: clientHistoryIds } }).lean()
      : [],
    // Fallback: entityId + cycleId lookups
    sbuIdsForFallback.length > 0
      ? SBUHistory.find({ sbuId: { $in: sbuIdsForFallback }, cycleId }).lean()
      : [],
    brandIdsForFallback.length > 0
      ? BrandHistory.find({
        brandId: { $in: brandIdsForFallback },
        cycleId,
      }).lean()
      : [],
    clientIdsForFallback.length > 0
      ? ClientHistory.find({
        clientId: { $in: clientIdsForFallback },
        cycleId,
      }).lean()
      : [],
  ]);

  // Create lookup maps
  const sbuHistoryMapById = {};
  sbuHistoriesById.forEach(h => {
    sbuHistoryMapById[h._id.toString()] = h;
  });

  const brandHistoryMapById = {};
  brandHistoriesById.forEach(h => {
    brandHistoryMapById[h._id.toString()] = h;
  });

  const clientHistoryMapById = {};
  clientHistoriesById.forEach(h => {
    clientHistoryMapById[h._id.toString()] = h;
  });

  // Fallback maps (by entityId)
  const sbuHistoryMapByEntity = {};
  sbuHistoriesByEntity.forEach(h => {
    sbuHistoryMapByEntity[h.sbuId.toString()] = h;
  });

  const brandHistoryMapByEntity = {};
  brandHistoriesByEntity.forEach(h => {
    brandHistoryMapByEntity[h.brandId.toString()] = h;
  });

  const clientHistoryMapByEntity = {};
  clientHistoriesByEntity.forEach(h => {
    clientHistoryMapByEntity[h.clientId.toString()] = h;
  });

  // Enrich each response with historical data
  return responses.map(response => {
    const enriched = { ...response };

    // Enrich SBU with historical data
    let sbuHistory = null;
    if (response.sbuHistoryId) {
      sbuHistory = sbuHistoryMapById[response.sbuHistoryId.toString()];
    } else if (response.sbuId?._id) {
      sbuHistory = sbuHistoryMapByEntity[response.sbuId._id.toString()];
    }

    if (sbuHistory && response.sbuId) {
      enriched.sbuId = {
        ...(response.sbuId._doc || response.sbuId),
        // Override with historical values
        executiveVP: sbuHistory.executiveVP,
        associateVP: sbuHistory.associateVP,
        associateVPs: sbuHistory.associateVPs || [],
        creativeDirector: sbuHistory.creativeDirector,
        leadNames: sbuHistory.leadNames || [],
        _historical: true,
        _historyId: sbuHistory._id,
      };
    }

    // Enrich Brand with historical data
    let brandHistory = null;
    if (response.brandHistoryId) {
      brandHistory = brandHistoryMapById[response.brandHistoryId.toString()];
    } else if (response.brandId?._id) {
      brandHistory = brandHistoryMapByEntity[response.brandId._id.toString()];
    }

    if (brandHistory && response.brandId) {
      enriched.brandId = {
        ...(response.brandId._doc || response.brandId),
        name: brandHistory.name,
        slug: brandHistory.slug,
        services: brandHistory.services || [],
        _historical: true,
        _historyId: brandHistory._id,
      };
    }

    // Enrich Client with historical data
    let clientHistory = null;
    if (response.clientHistoryId) {
      clientHistory = clientHistoryMapById[response.clientHistoryId.toString()];
    } else if (response.clientId?._id) {
      clientHistory =
        clientHistoryMapByEntity[response.clientId._id.toString()];
    }

    if (clientHistory && response.clientId) {
      enriched.clientId = {
        ...(response.clientId._doc || response.clientId),
        name: clientHistory.name,
        phone: clientHistory.phone,
        email: clientHistory.email,
        _historical: true,
        _historyId: clientHistory._id,
      };
    }

    return enriched;
  });
};

export default {
  buildFilter,
  buildFilterWithYear,
  calculatePagination,
  buildPaginationResponse,
  classifyScore,
  getClassificationColor,
  getNPSCategory,
  CSAT_CLASSIFICATION,
  getCSATClassification,
  isValidClassification,
  calculateChange,
  formatScore,
  calculateResponseScores,
  calculateAggregateScores,
  calculateFillRates,
  getCycleDateRange,
  toObjectId,
  isValidObjectId,
  enrichResponseWithScores,
  enrichResponsesWithScores,
  isHistoricalCycle,
  isCurrentCycle,
  enrichWithHistoricalData,
  RESPONSE_POPULATIONS,
  RESPONSE_POPULATIONS_DETAILED,
};
