/**
 * Dashboard Service
 * Business logic for CSAT dashboard data retrieval and aggregation
 */

import mongoose from 'mongoose';
import logger from '#config/logger.js';
import {
  CSATResponse,
  Department,
  Brand,
  BrandHistory,
  Cycle,
  SBU,
  SBUHistory,
  Client,
  ClientHistory,
} from '../../models/index.js';
import {
  buildFilterWithYear,
  calculatePagination,
  buildPaginationResponse,
  toObjectId,
  calculateAggregateScores,
  calculateFillRates,
  enrichResponsesWithScores,
  enrichResponseWithScores,
  enrichWithHistoricalData,
  isHistoricalCycle,
  calculateResponseScores,
  extractQuickScores,
  getCSATClassification,
  isValidClassification,
  getScoreNormalizationStages,
  RESPONSE_POPULATIONS,
  RESPONSE_POPULATIONS_DETAILED,
} from './helper.js';

const normalizeIdArray = values =>
  [...new Set((Array.isArray(values) ? values : [values])
    .map(id => (id ? String(id).trim() : null))
    .filter(Boolean))];

const resolveScopeIds = (singleId, multipleIds = []) =>
  singleId ? normalizeIdArray([singleId]) : normalizeIdArray(multipleIds);

const toObjectIdList = ids =>
  normalizeIdArray(ids).map(id => toObjectId(id)).filter(Boolean);

/**
 * Get all available filter options
 * @returns {Promise<Object>} Filter options
 */
const getFilterOptionsUnscoped = async () => {
  const [departments, brands, cycles, sbus, years] = await Promise.all([
    Department.find({ isActive: true })
      .select('name displayName hasSBUs')
      .sort({ name: 1 })
      .lean(),
    Brand.find({ isActive: true }).select('name slug').sort({ name: 1 }).lean(),
    Cycle.find({ isActive: true })
      .select('name cycleNumber year status')
      .sort({ year: -1, cycleNumber: -1 })
      .lean(),
    SBU.find({ isActive: true })
      .select(
        'name slug departmentId executiveVP associateVP associateVPs creativeDirector leadNames'
      )
      .populate('departmentId', 'name')
      .sort({ name: 1 })
      .lean(),
    Cycle.distinct('year'),
  ]);

  return {
    departments,
    brands,
    cycles,
    sbus,
    years: years.sort((a, b) => b - a), // Descending order
  };
};

const getFilterOptionsDepartmentScoped = async departmentIds => {
  const scopedDepartmentIds = (departmentIds || []).map(id => toObjectId(id));
  if (scopedDepartmentIds.length === 0) {
    return {
      departments: [],
      brands: [],
      cycles: [],
      sbus: [],
      years: [],
    };
  }

  const departments = await Department.find({
    _id: { $in: scopedDepartmentIds },
    isActive: true,
  })
    .select('name displayName hasSBUs')
    .sort({ name: 1 })
    .lean();

  if (departments.length === 0) {
    return {
      departments: [],
      brands: [],
      cycles: [],
      sbus: [],
      years: [],
    };
  }

  const departmentCodes = departments.map(department => department.name);
  const departmentObjectIds = departments.map(department => department._id);

  const [brands, cycles, sbus, years] = await Promise.all([
    Brand.find({
      isActive: true,
      services: {
        $elemMatch: {
          department: { $in: departmentCodes },
        },
      },
    })
      .select('name slug')
      .sort({ name: 1 })
      .lean(),
    Cycle.find({ isActive: true })
      .select('name cycleNumber year status')
      .sort({ year: -1, cycleNumber: -1 })
      .lean(),
    SBU.find({
      isActive: true,
      departmentId: { $in: departmentObjectIds },
    })
      .select(
        'name slug departmentId executiveVP associateVP associateVPs creativeDirector leadNames'
      )
      .populate('departmentId', 'name displayName hasSBUs')
      .sort({ name: 1 })
      .lean(),
    Cycle.distinct('year'),
  ]);

  return {
    departments,
    brands,
    cycles,
    sbus,
    years: years.sort((a, b) => b - a),
  };
};

/**
 * Get all available filter options with optional SBU scope
 * @param {Object} params - Optional filter params
 * @param {string} params.sbuId - Optional SBU scope
 * @param {string[]} params.sbuIds - Optional multiple SBU scopes
 * @param {string[]} params.departmentIds - Optional Department scope
 * @returns {Promise<Object>} Filter options
 */
export const getFilterOptions = async (params = {}) => {
  const { sbuId, sbuIds = [], departmentIds = [] } = params;
  const normalizedSbuIds = [
    ...new Set(
      [sbuId, ...(Array.isArray(sbuIds) ? sbuIds : [])]
        .map(id => (id ? String(id).trim() : null))
        .filter(Boolean)
    ),
  ];

  const scopedSbuObjectIds = normalizedSbuIds
    .map(id => toObjectId(id))
    .filter(Boolean);

  if (scopedSbuObjectIds.length > 0) {
    const [scopedSBUs, brands, cycles, years] = await Promise.all([
      SBU.find({ _id: { $in: scopedSbuObjectIds }, isActive: true })
        .select(
          'name slug departmentId executiveVP associateVP associateVPs creativeDirector leadNames'
        )
        .populate('departmentId', 'name displayName hasSBUs')
        .sort({ name: 1 })
        .lean(),
      Brand.find({
        isActive: true,
        'services.sbuId': { $in: scopedSbuObjectIds },
      })
        .select('name slug')
        .sort({ name: 1 })
        .lean(),
      Cycle.find({ isActive: true })
        .select('name cycleNumber year status')
        .sort({ year: -1, cycleNumber: -1 })
        .lean(),
      Cycle.distinct('year'),
    ]);

    if (scopedSBUs.length === 0) {
      return {
        departments: [],
        brands: [],
        cycles: [],
        sbus: [],
        years: [],
      };
    }

    const departmentsMap = new Map();
    scopedSBUs.forEach(sbu => {
      const department = sbu.departmentId;
      const departmentKey = department?._id?.toString();
      if (departmentKey && !departmentsMap.has(departmentKey)) {
        departmentsMap.set(departmentKey, department);
      }
    });

    return {
      departments: [...departmentsMap.values()],
      brands,
      cycles,
      sbus: scopedSBUs,
      years: years.sort((a, b) => b - a),
    };
  }

  if (Array.isArray(departmentIds) && departmentIds.length > 0) {
    return getFilterOptionsDepartmentScoped(departmentIds);
  }

  return getFilterOptionsUnscoped();
};

/**
 * Get responses filtered by department
 * @param {string} departmentId - Department ObjectId
 * @param {Object} options - Additional options (page, limit, cycleId, year, classification)
 * @param {string} options.classification - Optional CSAT classification filter: 'good' | 'average' | 'critical'
 *   - Good → CSAT ≥ 3.75
 *   - Average → CSAT ≥ 3.0 and < 3.75
 *   - Critical → CSAT < 3.0
 * @returns {Promise<Object>} Filtered responses with pagination
 */
export const getResponsesByDepartment = async (departmentId, options = {}) => {
  const { page, limit, cycleId, year, classification, sbuId, sbuIds = [] } =
    options;
  const pagination = calculatePagination(page, limit);

  const filter = await buildFilterWithYear({ cycleId, year, sbuId, sbuIds });
  filter.departmentId = toObjectId(departmentId);

  // Fetch all responses - we need to calculate CSAT scores for classification filtering
  // If classification is provided, we need to filter after scoring
  const needsClassificationFilter = classification && isValidClassification(classification);

  const [allResponsesRaw, department, fillRates] = await Promise.all([
    CSATResponse.find(filter)
      .populate(RESPONSE_POPULATIONS.brand)
      .populate(RESPONSE_POPULATIONS.client)
      .populate(RESPONSE_POPULATIONS.cycle)
      .populate(RESPONSE_POPULATIONS.sbu)
      .populate(RESPONSE_POPULATIONS.department)
      .sort({ submittedAt: -1 })
      .lean(),
    Department.findById(departmentId).select('name displayName').lean(),
    // Calculate fill rates for this department
    calculateFillRates({ departmentId, cycleId, year, sbuId, sbuIds }),
  ]);

  // Enrich responses with CSAT/NPS scores
  let enrichedResponses = enrichResponsesWithScores(allResponsesRaw);

  // Apply classification filter if provided
  if (needsClassificationFilter) {
    const classificationLower = classification.toLowerCase();
    enrichedResponses = enrichedResponses.filter(response => {
      const responseClassification = getCSATClassification(response.csat);
      return responseClassification === classificationLower;
    });
  }

  // Calculate aggregates from filtered responses
  // For aggregates, we need the data field from enriched responses
  const allResponsesForAggregate = enrichedResponses.map(r => ({ data: r.data }));
  const aggregateScores = calculateAggregateScores(allResponsesForAggregate);

  // Get total count after classification filter
  const total = enrichedResponses.length;

  // Apply pagination manually after classification filter
  let paginatedResponses = enrichedResponses;
  if (pagination.limit > 0) {
    paginatedResponses = enrichedResponses.slice(
      pagination.skip,
      pagination.skip + pagination.limit
    );
  } else if (pagination.skip > 0) {
    paginatedResponses = enrichedResponses.slice(pagination.skip);
  }

  // Enrich with historical data if older cycle
  const historicalResponses = await enrichWithHistoricalData(
    paginatedResponses,
    cycleId
  );

  return {
    department,
    classification: needsClassificationFilter ? classification.toLowerCase() : null,
    aggregates: {
      avgCSAT: aggregateScores.avgCSAT,
      avgNPS: aggregateScores.avgNPS,
      totalResponses: aggregateScores.totalResponses,
    },
    fillRates: {
      departmentFilter: fillRates.departmentFilter,
      totalMappedBrands: fillRates.totalMappedBrands,
      totalBrandsFilled: fillRates.totalBrandsFilled,
      totalBrandsUnfilled: fillRates.totalBrandsUnfilled,
      totalPOCs: fillRates.totalPOCs,
      totalPOCsFilled: fillRates.totalPOCsFilled,
      totalPOCsUnfilled: fillRates.totalPOCsUnfilled,
      brandFillRate: fillRates.brandFillRate,
      pocFillRate: fillRates.pocFillRate,
    },
    responses: historicalResponses,
    pagination: buildPaginationResponse(
      pagination.page,
      pagination.limit,
      total
    ),
  };
};

/**
 * Get department summary with all SBUs and their aggregated metrics
 * 
 * @param {string} departmentId - Department ObjectId (mandatory)
 * @param {string} cycleId - Cycle ObjectId (mandatory)
 * @param {Object} options - Additional options
 * @param {string} options.classification - Optional CSAT classification filter: 'good' | 'average' | 'critical'
 *   - Good → CSAT ≥ 3.75
 *   - Average → CSAT ≥ 3.0 and < 3.75
 *   - Critical → CSAT < 3.0
 *   - When provided, filters responses BEFORE aggregation
 * @returns {Promise<Object>} Department summary with SBU-wise aggregates
 * 
 * Response Structure:
 * {
 *   departmentId: string,
 *   cycleId: string,
 *   classification: string | null,
 *   aggregates: { avgCSAT, avgNPS, totalResponses },
 *   sbus: [{ sbuId, sbuName, aggregates: { avgCSAT, avgNPS, totalResponses } }]
 * }
 */
export const getDepartmentSummary = async (departmentId, cycleId, options = {}) => {
  const { classification, sbuId, sbuIds = [] } = options;
  const scopedSbuObjectIds = toObjectIdList(resolveScopeIds(sbuId, sbuIds));
  const needsClassificationFilter = classification && isValidClassification(classification);

  // Get department info
  const department = await Department.findById(departmentId).select('name displayName').lean();

  if (!department) {
    throw new Error('Department not found');
  }

  const useHistoricalModels = await isHistoricalCycle(cycleId);
  let departmentSBUs = [];

  if (useHistoricalModels) {
    const sbuHistoryFilter = {
      departmentId: toObjectId(departmentId),
      cycleId: toObjectId(cycleId),
    };
    if (scopedSbuObjectIds.length > 0) {
      sbuHistoryFilter.sbuId = { $in: scopedSbuObjectIds };
    }

    const sbuHistories = await SBUHistory.find(sbuHistoryFilter)
      .populate('sbuId', 'name slug isActive')
      .select('sbuId executiveVP associateVP associateVPs creativeDirector leadNames')
      .lean();

    const sbuHistoriesMap = new Map();
    sbuHistories.forEach(history => {
      if (history.sbuId && history.sbuId.isActive) {
        sbuHistoriesMap.set(history.sbuId._id.toString(), {
          _id: history.sbuId._id,
          name: history.sbuId.name,
          slug: history.sbuId.slug,
          executiveVP: history.executiveVP,
          associateVP: history.associateVP,
          associateVPs: history.associateVPs || [],
          creativeDirector: history.creativeDirector,
          leadNames: history.leadNames || [],
        });
      }
    });

    if (sbuHistoriesMap.size > 0) {
      departmentSBUs = Array.from(sbuHistoriesMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }
  }

  // Ongoing/non-finalized cycles should always use current models.
  if (departmentSBUs.length === 0) {
    const sbuFilter = { departmentId: toObjectId(departmentId), isActive: true };
    if (scopedSbuObjectIds.length > 0) {
      sbuFilter._id = { $in: scopedSbuObjectIds };
    }

    departmentSBUs = await SBU.find(sbuFilter)
      .select('name slug executiveVP associateVP associateVPs creativeDirector leadNames')
      .sort({ name: 1 })
      .lean();
  }

  // Build base filter for responses
  const filter = {
    isValid: true,
    departmentId: toObjectId(departmentId),
    cycleId: toObjectId(cycleId),
  };
  if (scopedSbuObjectIds.length > 0) {
    filter.sbuId = { $in: scopedSbuObjectIds };
  }

  // Fetch all responses for this department and cycle
  const allResponsesRaw = await CSATResponse.find(filter)
    .select('sbuId data version')
    .lean();

  // Enrich with CSAT scores for classification filtering
  let allResponses = allResponsesRaw.map(response => {
    const { csatScore, npsScore } = calculateResponseScores(response.data, response.version);
    return {
      ...response,
      csat: csatScore,
      nps: npsScore,
    };
  });

  // Apply classification filter if provided
  if (needsClassificationFilter) {
    const classificationLower = classification.toLowerCase();
    allResponses = allResponses.filter(response => {
      const responseClassification = getCSATClassification(response.csat);
      return responseClassification === classificationLower;
    });
  }

  // Group responses by SBU
  const responsesBySBU = new Map();
  allResponses.forEach(response => {
    const sbuIdStr = response.sbuId?.toString() || 'unmapped';
    if (!responsesBySBU.has(sbuIdStr)) {
      responsesBySBU.set(sbuIdStr, []);
    }
    responsesBySBU.get(sbuIdStr).push(response);
  });

  // Calculate aggregates for each SBU
  const sbuResults = departmentSBUs.map(sbu => {
    const sbuIdStr = sbu._id.toString();
    const sbuResponses = responsesBySBU.get(sbuIdStr) || [];

    // Calculate averages from individual response scores
    let totalCSAT = 0;
    let totalNPS = 0;
    sbuResponses.forEach(r => {
      totalCSAT += r.csat || 0;
      totalNPS += r.nps || 0;
    });

    const avgCSAT = sbuResponses.length > 0
      ? Math.round((totalCSAT / sbuResponses.length) * 100) / 100
      : 0;
    const avgNPS = sbuResponses.length > 0
      ? Math.round((totalNPS / sbuResponses.length) * 100) / 100
      : 0;
    logger.debug('Calculated SBU response aggregation', {
      sbuId: sbu._id,
      sbuName: sbu.name,
      responseCount: sbuResponses.length,
    });
    return {
      sbuId: sbu._id,
      sbuName: sbu.name,
      sbuSlug: sbu.slug,
      executiveVP: sbu.executiveVP,
      associateVP: sbu.associateVP,
      associateVPs: sbu.associateVPs || [],
      creativeDirector: sbu.creativeDirector,
      leadNames: sbu.leadNames || [],
      aggregates: {
        avgCSAT,
        avgNPS,
        totalResponses: sbuResponses.length,
      },


      // Classification for this SBU's average CSAT
      sbuClassification: sbuResponses.length > 0 ? getCSATClassification(avgCSAT) : 'NA',
    };
  });

  // Calculate overall department aggregates from filtered responses
  let overallTotalCSAT = 0;
  let overallTotalNPS = 0;
  allResponses.forEach(r => {
    overallTotalCSAT += r.csat || 0;
    overallTotalNPS += r.nps || 0;
  });

  const overallAvgCSAT = allResponses.length > 0
    ? Math.round((overallTotalCSAT / allResponses.length) * 100) / 100
    : 0;
  const overallAvgNPS = allResponses.length > 0
    ? Math.round((overallTotalNPS / allResponses.length) * 100) / 100
    : 0;

  return {
    departmentId,
    departmentName: department.displayName || department.name,
    cycleId,
    classification: needsClassificationFilter ? classification.toLowerCase() : null,
    aggregates: {
      avgCSAT: overallAvgCSAT,
      avgNPS: overallAvgNPS,
      totalResponses: allResponses.length,
    },
    sbus: sbuResults,
  };
};

/**
 * Get responses filtered by brand
 * @param {string} brandId - Brand ObjectId
 * @param {Object} options - Additional options (page, limit, departmentId, cycleId, year)
 * @returns {Promise<Object>} Filtered responses with pagination
 */
export const getResponsesByBrand = async (brandId, options = {}) => {
  const {
    page,
    limit,
    departmentId,
    cycleId,
    year,
    sbuId,
    sbuIds = [],
  } = options;
  const pagination = calculatePagination(page, limit);

  const filter = await buildFilterWithYear({
    departmentId,
    cycleId,
    year,
    sbuId,
    sbuIds,
  });
  filter.brandId = toObjectId(brandId);

  // Build query - conditionally apply limit (0 = no limit for exports)
  let responsesQuery = CSATResponse.find(filter)
    .populate(RESPONSE_POPULATIONS.client)
    .populate(RESPONSE_POPULATIONS.department)
    .populate(RESPONSE_POPULATIONS.cycle)
    .populate(RESPONSE_POPULATIONS.sbu)
    .sort({ submittedAt: -1 })
    .skip(pagination.skip);

  // Only apply limit if > 0 (0 means export all)
  if (pagination.limit > 0) {
    responsesQuery = responsesQuery.limit(pagination.limit);
  }

  const [responses, total, brand, allResponses] = await Promise.all([
    responsesQuery.lean(),
    CSATResponse.countDocuments(filter),
    Brand.findById(brandId).select('name slug services').lean(),
    CSATResponse.find(filter).select('data').lean(),
  ]);

  const aggregateScores = calculateAggregateScores(allResponses);

  // Enrich with CSAT/NPS scores, then with historical data if older cycle
  const enrichedResponses = enrichResponsesWithScores(responses);
  const historicalResponses = await enrichWithHistoricalData(
    enrichedResponses,
    cycleId
  );

  return {
    brand,
    aggregates: {
      avgCSAT: aggregateScores.avgCSAT,
      avgNPS: aggregateScores.avgNPS,
      totalResponses: aggregateScores.totalResponses,
    },
    responses: historicalResponses,
    pagination: buildPaginationResponse(
      pagination.page,
      pagination.limit,
      total
    ),
  };
};

/**
 * Get responses filtered by cycle
 * @param {string} cycleId - Cycle ObjectId
 * @param {Object} options - Additional options (page, limit, departmentId, brandId)
 * @returns {Promise<Object>} Filtered responses with pagination
 */
export const getResponsesByCycle = async (cycleId, options = {}) => {
  const { page, limit, departmentId, brandId, sbuId, sbuIds = [] } = options;
  const pagination = calculatePagination(page, limit);

  const filter = await buildFilterWithYear({
    departmentId,
    brandId,
    cycleId,
    sbuId,
    sbuIds,
  });

  // Build query - conditionally apply limit (0 = no limit for exports)
  let responsesQuery = CSATResponse.find(filter)
    .populate(RESPONSE_POPULATIONS.brand)
    .populate(RESPONSE_POPULATIONS.client)
    .populate(RESPONSE_POPULATIONS.department)
    .populate(RESPONSE_POPULATIONS.sbu)
    .sort({ submittedAt: -1 })
    .skip(pagination.skip);

  // Only apply limit if > 0 (0 means export all)
  if (pagination.limit > 0) {
    responsesQuery = responsesQuery.limit(pagination.limit);
  }

  const [responses, total, cycle, allResponses] = await Promise.all([
    responsesQuery.lean(),
    CSATResponse.countDocuments(filter),
    Cycle.findById(cycleId)
      .select('name cycleNumber year status startDate endDate')
      .lean(),
    CSATResponse.find(filter).select('data').lean(),
  ]);

  const aggregateScores = calculateAggregateScores(allResponses);

  // Enrich with CSAT/NPS scores, then with historical data if older cycle
  const enrichedResponses = enrichResponsesWithScores(responses);
  const historicalResponses = await enrichWithHistoricalData(
    enrichedResponses,
    cycleId
  );

  return {
    cycle,
    aggregates: {
      avgCSAT: aggregateScores.avgCSAT,
      avgNPS: aggregateScores.avgNPS,
      totalResponses: aggregateScores.totalResponses,
    },
    responses: historicalResponses,
    pagination: buildPaginationResponse(
      pagination.page,
      pagination.limit,
      total
    ),
  };
};

/**
 * Get cycles for a specific year
 * Returns only cycle information with IDs - no responses
 * @param {number} year - Year to filter
 * @param {Object} options - Optional scope
 * @param {string} options.sbuId - Optional SBU scope
 * @returns {Promise<Object>} Cycles for the year
 */
export const getResponsesByYear = async (year, options = {}) => {
  const { sbuId, sbuIds = [] } = options;
  const scopedSbuObjectIds = toObjectIdList(resolveScopeIds(sbuId, sbuIds));

  const cycleQuery = { year: parseInt(year) };
  if (scopedSbuObjectIds.length > 0) {
    const scopedCycleIds = await CSATResponse.distinct('cycleId', {
      isValid: true,
      sbuId: { $in: scopedSbuObjectIds },
    });
    cycleQuery._id = { $in: scopedCycleIds };
  }

  const cycles = await Cycle.find(cycleQuery)
    .select('_id name cycleNumber year status startDate endDate')
    .sort({ cycleNumber: 1 })
    .lean();

  return {
    year: parseInt(year),
    cycles,
    totalCycles: cycles.length,
  };
};

/**
 * Get responses filtered by SBU
 * @param {string} sbuId - SBU ObjectId
 * @param {Object} options - Additional options (page, limit, cycleId, year)
 * @returns {Promise<Object>} Filtered responses with pagination
 */
export const getResponsesBySBU = async (sbuId, options = {}) => {
  const { page, limit, cycleId, year } = options;
  const pagination = calculatePagination(page, limit);

  const filter = await buildFilterWithYear({ cycleId, year });
  filter.sbuId = toObjectId(sbuId);

  // Build query - conditionally apply limit (0 = no limit for exports)
  let responsesQuery = CSATResponse.find(filter)
    .populate(RESPONSE_POPULATIONS.brand)
    .populate(RESPONSE_POPULATIONS.client)
    .populate(RESPONSE_POPULATIONS.cycle)
    .populate(RESPONSE_POPULATIONS.department)
    .sort({ submittedAt: -1 })
    .skip(pagination.skip);

  // Only apply limit if > 0 (0 means export all)
  if (pagination.limit > 0) {
    responsesQuery = responsesQuery.limit(pagination.limit);
  }

  const [responses, total, sbu, allResponses, fillRates] = await Promise.all([
    responsesQuery.lean(),
    CSATResponse.countDocuments(filter),
    SBU.findById(sbuId)
      .select('name executiveVP associateVP creativeDirector leadNames')
      .lean(),
    // Fetch all responses (without pagination) for aggregate calculation
    CSATResponse.find(filter).select('data').lean(),
    // Calculate fill rates for this SBU
    calculateFillRates({ sbuId, cycleId, year }),
  ]);

  // Calculate CSAT and NPS averages
  const aggregateScores = calculateAggregateScores(allResponses);

  // Enrich with CSAT/NPS scores, then with historical data if older cycle
  const enrichedResponses = enrichResponsesWithScores(responses);
  const historicalResponses = await enrichWithHistoricalData(
    enrichedResponses,
    cycleId
  );

  return {
    sbu,
    aggregates: {
      avgCSAT: aggregateScores.avgCSAT,
      avgNPS: aggregateScores.avgNPS,
      totalResponses: aggregateScores.totalResponses,
    },
    fillRates: {
      sbuFilter: fillRates.sbuFilter,
      totalMappedBrands: fillRates.totalMappedBrands,
      totalBrandsFilled: fillRates.totalBrandsFilled,
      totalBrandsUnfilled: fillRates.totalBrandsUnfilled,
      totalPOCs: fillRates.totalPOCs,
      totalPOCsFilled: fillRates.totalPOCsFilled,
      totalPOCsUnfilled: fillRates.totalPOCsUnfilled,
      brandFillRate: fillRates.brandFillRate,
      pocFillRate: fillRates.pocFillRate,
    },
    responses: historicalResponses,
    pagination: buildPaginationResponse(
      pagination.page,
      pagination.limit,
      total
    ),
  };
};

/**
 * Get dashboard statistics with filters
 * @param {Object} params - Filter parameters (departmentId, brandId, cycleId, sbuId, year)
 * @returns {Promise<Object>} Statistics summary
 */
export const getStatistics = async (params = {}) => {
  const filter = await buildFilterWithYear(params);
  const scopedDepartmentIds = Array.isArray(params.departmentIds)
    ? params.departmentIds.filter(Boolean)
    : [];
  const fillRateParams = { ...params };

  if (
    !params.departmentId &&
    scopedDepartmentIds.length > 0 &&
    !filter.departmentId
  ) {
    filter.departmentId = { $in: scopedDepartmentIds.map(id => toObjectId(id)) };
  }

  if (!params.departmentId && scopedDepartmentIds.length > 0) {
    fillRateParams.departmentIds = scopedDepartmentIds;
    delete fillRateParams.departmentId;
  }

  const [stats, scoreDistribution, fillRates] = await Promise.all([
    CSATResponse.aggregate([
      { $match: filter },
      ...getScoreNormalizationStages(),
      {
        $group: {
          _id: null,
          totalResponses: { $sum: 1 },
          avgOverallSatisfaction: { $avg: '$_csatScore' },
          avgLikelihoodToRecommend: { $avg: '$_npsScore' },
          uniqueBrands: { $addToSet: '$brandId' },
          uniquePOCs: { $addToSet: '$clientId' },
          uniqueDepartments: { $addToSet: '$departmentId' },
        },
      },
      {
        $project: {
          _id: 0,
          totalResponses: 1,
          avgOverallSatisfaction: { $round: ['$avgOverallSatisfaction', 2] },
          avgLikelihoodToRecommend: {
            $round: ['$avgLikelihoodToRecommend', 2],
          },
          brandCount: { $size: '$uniqueBrands' },
          pocCount: { $size: '$uniquePOCs' },
          departmentCount: { $size: '$uniqueDepartments' },
        },
      },
    ]),
    CSATResponse.aggregate([
      { $match: filter },
      ...getScoreNormalizationStages(),
      {
        $group: {
          _id: { $round: ['$_csatScore', 0] },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]),
    // Calculate fill rates to get brandsFilled (unique brands that filled CSAT / total brands)
    calculateFillRates(fillRateParams),
  ]);

  const totalResponses = stats[0]?.totalResponses || 0;

  return {
    summary: {
      ...(stats[0] || {
        totalResponses: 0,
        avgOverallSatisfaction: 0,
        avgLikelihoodToRecommend: 0,
        brandCount: 0,
        pocCount: 0,
        departmentCount: 0,
      }),
      // Add brandsFilled: how many unique brands have filled CSAT out of total mapped brands
      brandsFilled: fillRates.totalBrandsFilled,
      totalBrands: fillRates.totalMappedBrands,
      // Add pocsFilled: how many unique POCs have filled CSAT out of total mapped POCs
      pocsFilled: fillRates.totalPOCsFilled,
      totalPOCs: fillRates.totalPOCs,
    },
    scoreDistribution: scoreDistribution.map(s => ({
      score: s._id,
      count: s.count,
      percentage:
        totalResponses > 0
          ? Math.round((s.count / totalResponses) * 100 * 100) / 100
          : 0,
    })),
  };
};

/**
 * Get department-wise aggregation
 * @param {Object} params - Filter parameters (cycleId, year)
 * @returns {Promise<Array>} Department statistics
 */
export const getDepartmentAggregation = async (params = {}) => {
  const filter = await buildFilterWithYear(params);

  return CSATResponse.aggregate([
    { $match: filter },
    ...getScoreNormalizationStages(),
    {
      $group: {
        _id: '$departmentId',
        totalResponses: { $sum: 1 },
        avgSatisfaction: { $avg: '$_csatScore' },
        avgNPS: { $avg: '$_npsScore' },
        brands: { $addToSet: '$brandId' },
      },
    },
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: '_id',
        as: 'department',
      },
    },
    { $unwind: '$department' },
    {
      $project: {
        _id: 0,
        departmentId: '$_id',
        departmentName: '$department.name',
        totalResponses: 1,
        avgSatisfaction: { $round: ['$avgSatisfaction', 2] },
        avgNPS: { $round: ['$avgNPS', 2] },
        brandCount: { $size: '$brands' },
      },
    },
    { $sort: { avgSatisfaction: -1 } },
  ]);
};

/**
 * Get brand-wise aggregation
 * @param {Object} params - Filter parameters (departmentId, cycleId, year, limit)
 * @returns {Promise<Array>} Brand statistics
 */
export const getBrandAggregation = async (params = {}) => {
  const { limit = 100 } = params;
  const filter = await buildFilterWithYear(params);

  return CSATResponse.aggregate([
    { $match: filter },
    ...getScoreNormalizationStages(),
    {
      $group: {
        _id: '$brandId',
        totalResponses: { $sum: 1 },
        avgSatisfaction: { $avg: '$_csatScore' },
        avgNPS: { $avg: '$_npsScore' },
        pocs: { $addToSet: '$clientId' },
      },
    },
    {
      $lookup: {
        from: 'brands',
        localField: '_id',
        foreignField: '_id',
        as: 'brand',
      },
    },
    { $unwind: '$brand' },
    {
      $project: {
        _id: 0,
        brandId: '$_id',
        brandName: '$brand.name',
        brandSlug: '$brand.slug',
        totalResponses: 1,
        avgSatisfaction: { $round: ['$avgSatisfaction', 2] },
        avgNPS: { $round: ['$avgNPS', 2] },
        pocCount: { $size: '$pocs' },
        classification: {
          $switch: {
            branches: [
              { case: { $gte: ['$avgSatisfaction', 4] }, then: 'excellent' },
              { case: { $gte: ['$avgSatisfaction', 3] }, then: 'good' },
              { case: { $gte: ['$avgSatisfaction', 2] }, then: 'average' },
            ],
            default: 'critical',
          },
        },
      },
    },
    { $sort: { avgSatisfaction: -1 } },
    { $limit: parseInt(limit) },
  ]);
};

/**
 * Get SBU-wise aggregation
 * @param {Object} params - Filter parameters (cycleId, year)
 * @returns {Promise<Array>} SBU statistics
 */
export const getSBUAggregation = async (params = {}) => {
  const filter = await buildFilterWithYear(params);
  if (params.sbuId) {
    filter.sbuId = toObjectId(params.sbuId);
  }
  if (!filter.sbuId) {
    filter.sbuId = { $ne: null };
  }

  return CSATResponse.aggregate([
    { $match: filter },
    ...getScoreNormalizationStages(),
    {
      $group: {
        _id: '$sbuId',
        totalResponses: { $sum: 1 },
        avgSatisfaction: { $avg: '$_csatScore' },
        avgNPS: { $avg: '$_npsScore' },
        brands: { $addToSet: '$brandId' },
      },
    },
    {
      $lookup: {
        from: 'sbus',
        localField: '_id',
        foreignField: '_id',
        as: 'sbu',
      },
    },
    { $unwind: '$sbu' },
    {
      $project: {
        _id: 0,
        sbuId: '$_id',
        sbuName: '$sbu.name',
        executiveVP: '$sbu.executiveVP',
        associateVP: '$sbu.associateVP',
        associateVPs: '$sbu.associateVPs',
        creativeDirector: '$sbu.creativeDirector',
        leadNames: '$sbu.leadNames',
        totalResponses: 1,
        avgSatisfaction: { $round: ['$avgSatisfaction', 2] },
        avgNPS: { $round: ['$avgNPS', 2] },
        brandCount: { $size: '$brands' },
        classification: {
          $switch: {
            branches: [
              { case: { $gte: ['$avgSatisfaction', 3.75] }, then: 'good' },
              { case: { $gte: ['$avgSatisfaction', 3] }, then: 'average' },
            ],
            default: 'critical',
          },
        },
      },
    },
    { $sort: { avgSatisfaction: -1 } },
  ]);
};

/**
 * Get cycle comparison data
 * @param {Object} params - Filter parameters (departmentId, year)
 * @returns {Promise<Array>} Cycle-wise statistics
 */
export const getCycleComparison = async (params = {}) => {
  const filter = await buildFilterWithYear(params);

  return CSATResponse.aggregate([
    { $match: filter },
    ...getScoreNormalizationStages(),
    {
      $group: {
        _id: '$cycleId',
        totalResponses: { $sum: 1 },
        avgSatisfaction: { $avg: '$_csatScore' },
        avgNPS: { $avg: '$_npsScore' },
        brands: { $addToSet: '$brandId' },
      },
    },
    {
      $lookup: {
        from: 'cycles',
        localField: '_id',
        foreignField: '_id',
        as: 'cycle',
      },
    },
    { $unwind: '$cycle' },
    {
      $project: {
        _id: 0,
        cycleId: '$_id',
        cycleName: '$cycle.name',
        cycleNumber: '$cycle.cycleNumber',
        year: '$cycle.year',
        totalResponses: 1,
        avgSatisfaction: { $round: ['$avgSatisfaction', 2] },
        avgNPS: { $round: ['$avgNPS', 2] },
        brandCount: { $size: '$brands' },
      },
    },
    { $sort: { year: -1, cycleNumber: -1 } },
  ]);
};

/**
 * Get single response by ID
 * @param {string} responseId - Response ObjectId
 * @returns {Promise<Object|null>} Response document
 */
export const getResponseById = async (responseId, options = {}) => {
  const query = { _id: responseId };
  const scopedSbuIds = Array.isArray(options.sbuIds)
    ? [...new Set(options.sbuIds.map(id => String(id).trim()).filter(Boolean))]
    : [];
  const scopedDepartmentIds = Array.isArray(options.departmentIds)
    ? [
      ...new Set(
        options.departmentIds.map(id => String(id).trim()).filter(Boolean)
      ),
    ]
    : [];

  const scopedSbuObjectIds = scopedSbuIds.map(toObjectId).filter(Boolean);
  const scopedDepartmentObjectIds = scopedDepartmentIds
    .map(toObjectId)
    .filter(Boolean);

  if (options.sbuId) {
    const scopedSbuObjectId = toObjectId(options.sbuId);
    if (scopedSbuObjectId) {
      query.sbuId = scopedSbuObjectId;
    }
  } else if (scopedSbuObjectIds.length > 0) {
    query.sbuId = { $in: scopedSbuObjectIds };
  } else if (scopedDepartmentObjectIds.length > 0) {
    query.departmentId = { $in: scopedDepartmentObjectIds };
  }

  const response = await CSATResponse.findOne(query)
    .populate(RESPONSE_POPULATIONS_DETAILED.brand)
    .populate(RESPONSE_POPULATIONS_DETAILED.client)
    .populate(RESPONSE_POPULATIONS_DETAILED.department)
    .populate(RESPONSE_POPULATIONS_DETAILED.cycle)
    .populate(RESPONSE_POPULATIONS_DETAILED.sbu)
    .lean();

  if (!response) return null;
  const useHistoricalModels = response.cycleId?._id
    ? await isHistoricalCycle(response.cycleId._id)
    : false;

  // If history IDs exist, populate from history models for accurate historical data
  if (useHistoricalModels && response.sbuHistoryId) {
    const sbuHistory = await SBUHistory.findById(response.sbuHistoryId)
      .select('executiveVP associateVP associateVPs creativeDirector leadNames brands')
      .lean();

    if (sbuHistory && response.sbuId) {
      // Merge history data with basic SBU info
      response.sbuId = {
        ...response.sbuId,
        executiveVP: sbuHistory.executiveVP,
        associateVP: sbuHistory.associateVP,
        associateVPs: sbuHistory.associateVPs || [],
        creativeDirector: sbuHistory.creativeDirector,
        leadNames: sbuHistory.leadNames || [],
      };
    }
  }

  if (useHistoricalModels && response.brandHistoryId) {
    const brandHistory = await BrandHistory.findById(response.brandHistoryId)
      .select('brandName services isActive')
      .lean();

    if (brandHistory && response.brandId) {
      // Merge history data with basic brand info
      response.brandId = {
        ...response.brandId,
        name: brandHistory.brandName,
        services: brandHistory.services || [],
        isActive: brandHistory.isActive,
      };
    }
  }

  if (useHistoricalModels && response.clientHistoryId) {
    const clientHistory = await ClientHistory.findById(response.clientHistoryId)
      .select('clientName phone email serviceMapping')
      .lean();

    if (clientHistory && response.clientId) {
      // Merge history data with basic client info
      response.clientId = {
        ...response.clientId,
        name: clientHistory.clientName,
        phone: clientHistory.phone,
        email: clientHistory.email,
        serviceMapping: clientHistory.serviceMapping || [],
      };
    }
  }

  return enrichResponseWithScores(response);
};

/**
 * Get brands filled/unfilled for coverage tracking
 * @param {Object} params - Filter parameters (cycleId, year, departmentId, filled, groupBy)
 * @returns {Promise<Object>} Brands with fill status
 *
 * Key metrics:
 * - totalBrandsFilled: Brands where at least 1 POC submitted CSAT
 * - totalPOCsFilled: Total unique POCs (clients) who submitted CSAT
 */
export const getBrandsFilled = async (params = {}) => {
  const {
    cycleId,
    year,
    departmentId,
    departmentIds = [],
    sbuId,
    sbuIds = [],
    filled = true,
    groupBy = 'sbu',
  } = params;

  const scopedDepartmentIds = resolveScopeIds(departmentId, departmentIds);
  const scopedSbuIds = resolveScopeIds(sbuId, sbuIds);
  const scopedDepartmentObjectIds = toObjectIdList(scopedDepartmentIds);
  const scopedSbuObjectIds = toObjectIdList(scopedSbuIds);
  const hasSbuScope = scopedSbuIds.length > 0;

  const [scopedDepartments, scopedSBUs] = await Promise.all([
    scopedDepartmentObjectIds.length > 0
      ? Department.find({ _id: { $in: scopedDepartmentObjectIds } })
        .select('name displayName')
        .lean()
      : [],
    scopedSbuObjectIds.length > 0
      ? SBU.find({ _id: { $in: scopedSbuObjectIds } })
        .select('name brands')
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
  const scopedSbuBrandIds = [
    ...new Set(
      scopedSBUs
        .flatMap(sbu => sbu.brands || [])
        .map(brandId => String(brandId))
    ),
  ]
    .map(id => toObjectId(id))
    .filter(Boolean);
  const scopedSbuIdSet = new Set(scopedSbuIds.map(id => String(id)));
  const scopedDepartmentCodeSet = new Set(
    scopedDepartmentCodes.map(code => String(code).toLowerCase())
  );

  // Get filter for cycle/year/department/sbu
  const responseFilter = await buildFilterWithYear({
    cycleId,
    year,
    departmentId,
    departmentIds: scopedDepartmentIds,
    sbuId,
    sbuIds: scopedSbuIds,
  });

  // Get all brands that have submitted CSAT in this scope (at least 1 POC filled)
  const filledBrandIds = await CSATResponse.distinct('brandId', responseFilter);

  // Get all unique POCs (clients) who filled CSAT
  const filledClientIds = await CSATResponse.distinct(
    'clientId',
    responseFilter
  );
  const totalPOCsFilled = filledClientIds.length;

  // Get per-brand POC counts (how many POCs filled for each brand)
  const brandPOCCounts = await CSATResponse.aggregate([
    { $match: responseFilter },
    {
      $group: {
        _id: '$brandId',
        filledPOCs: { $addToSet: '$clientId' },
        responseCount: { $sum: 1 },
      },
    },
    {
      $project: {
        brandId: '$_id',
        filledPOCCount: { $size: '$filledPOCs' },
        responseCount: 1,
      },
    },
  ]);

  const brandStatsMap = {};
  brandPOCCounts.forEach(stat => {
    brandStatsMap[stat._id.toString()] = {
      filledPOCCount: stat.filledPOCCount,
      responseCount: stat.responseCount,
    };
  });

  // Build base brand scope using department + optional SBU
  const baseBrandQuery = { isActive: true };
  if (scopedDepartmentCodes.length > 0) {
    baseBrandQuery['services.department'] = { $in: scopedDepartmentCodes };
  }
  if (hasSbuScope) {
    baseBrandQuery._id = { $in: scopedSbuBrandIds };
  }

  const scopedBrands = await Brand.find(baseBrandQuery).select('_id').lean();
  const scopedBrandIds = scopedBrands.map(brand => brand._id);
  const filledBrandSet = new Set(filledBrandIds.map(id => id.toString()));

  const targetBrandIds = scopedBrandIds.filter(id =>
    filled ? filledBrandSet.has(id.toString()) : !filledBrandSet.has(id.toString())
  );

  const brandQuery = {
    ...baseBrandQuery,
    _id: { $in: targetBrandIds },
  };

  const brands = await Brand.find(brandQuery)
    .populate('services.sbuId', 'name executiveVP associateVP creativeDirector')
    .select('name slug services')
    .lean();

  // Get total POCs (clients) count per brand for the specific department
  const brandIds = brands.map(b => b._id);
  const clientQuery = { brandId: { $in: brandIds }, isActive: true };
  if (scopedDepartmentCodes.length > 0) {
    clientQuery['serviceMapping.department'] = { $in: scopedDepartmentCodes };
  }

  const totalPOCsPerBrand = await Client.aggregate([
    { $match: clientQuery },
    { $group: { _id: '$brandId', totalPOCs: { $sum: 1 } } },
  ]);

  const totalPOCsMap = {};
  totalPOCsPerBrand.forEach(item => {
    totalPOCsMap[item._id.toString()] = item.totalPOCs;
  });

  // Group brands by SBU or Department
  const grouped = {};
  const ungrouped = [];

  brands.forEach(brand => {
    const scopedService =
      brand.services?.find(service => {
        const serviceSbuId = service?.sbuId?._id
          ? String(service.sbuId._id)
          : service?.sbuId
            ? String(service.sbuId)
            : null;
        const serviceDepartment = service?.department
          ? String(service.department).toLowerCase()
          : null;

        const sbuMatch =
          scopedSbuIdSet.size === 0 ||
          (serviceSbuId && scopedSbuIdSet.has(serviceSbuId));
        const departmentMatch =
          scopedDepartmentCodeSet.size === 0 ||
          (serviceDepartment &&
            scopedDepartmentCodeSet.has(serviceDepartment));

        return sbuMatch && departmentMatch;
      }) || brand.services?.[0];

    const sbu = scopedService?.sbuId;
    const sbuName = sbu?.name || 'Unmapped';

    const brandStats = brandStatsMap[brand._id.toString()] || {
      filledPOCCount: 0,
      responseCount: 0,
    };

    const brandData = {
      brandId: brand._id,
      brandName: brand.name,
      brandSlug: brand.slug,
      sbuName,
      sbuDetails: sbu
        ? {
          executiveVP: sbu.executiveVP,
          associateVP: sbu.associateVP,
          creativeDirector: sbu.creativeDirector,
        }
        : null,
      totalPOCCount: totalPOCsMap[brand._id.toString()] || 0,
      filledPOCCount: brandStats.filledPOCCount,
      unfilledPOCCount:
        (totalPOCsMap[brand._id.toString()] || 0) - brandStats.filledPOCCount,
      responseCount: brandStats.responseCount,
    };

    if (groupBy === 'sbu') {
      if (!grouped[sbuName]) {
        grouped[sbuName] = {
          sbuName,
          sbuDetails: brandData.sbuDetails,
          brands: [],
          totalBrands: 0,
          totalPOCs: 0,
          totalFilledPOCs: 0,
          totalUnfilledPOCs: 0,
          totalResponses: 0,
        };
      }
      grouped[sbuName].brands.push(brandData);
      grouped[sbuName].totalBrands++;
      grouped[sbuName].totalPOCs += brandData.totalPOCCount;
      grouped[sbuName].totalFilledPOCs += brandData.filledPOCCount;
      grouped[sbuName].totalUnfilledPOCs += brandData.unfilledPOCCount;
      grouped[sbuName].totalResponses += brandData.responseCount;
    } else {
      ungrouped.push(brandData);
    }
  });

  // Get total counts (filtered by department if specified)
  const totalBrandsQuery = { isActive: true };
  const totalPOCsQuery = { isActive: true };
  if (scopedDepartmentCodes.length > 0) {
    totalBrandsQuery['services.department'] = { $in: scopedDepartmentCodes };
    totalPOCsQuery['serviceMapping.department'] = { $in: scopedDepartmentCodes };
  }
  if (hasSbuScope) {
    totalBrandsQuery._id = { $in: scopedSbuBrandIds };
    totalPOCsQuery.brandId = { $in: scopedSbuBrandIds };
  }

  const [totalMappedBrands, totalPOCs] = await Promise.all([
    Brand.countDocuments(totalBrandsQuery),
    Client.countDocuments(totalPOCsQuery),
  ]);

  const scopedFilledBrandsCount = scopedBrandIds.filter(id =>
    filledBrandSet.has(id.toString())
  ).length;

  return {
    filled,
    departmentFilter:
      scopedDepartmentNames.length > 0
        ? scopedDepartmentNames.join(', ')
        : 'all',
    sbuFilter: scopedSbuNames.length > 0 ? scopedSbuNames.join(', ') : null,
    // Summary metrics
    totalMappedBrands,
    totalBrandsFilled: scopedFilledBrandsCount,
    totalBrandsUnfilled: Math.max(0, totalMappedBrands - scopedFilledBrandsCount),
    totalPOCs,
    totalPOCsFilled,
    totalPOCsUnfilled: Math.max(0, totalPOCs - totalPOCsFilled),
    brandFillRate:
      totalMappedBrands > 0
        ? Math.round((scopedFilledBrandsCount / totalMappedBrands) * 100 * 100) /
        100
        : 0,
    pocFillRate:
      totalPOCs > 0
        ? Math.round((totalPOCsFilled / totalPOCs) * 100 * 100) / 100
        : 0,
    // Grouped data
    data: groupBy === 'sbu' ? Object.values(grouped) : ungrouped,
  };
};

/**
 * Get recent CSAT responses across all departments
 * @param {Object} params - Filter parameters (departmentId, search, startDate, endDate, limit)
 * @returns {Promise<Object>} Recent responses
 */
export const getRecentResponses = async (params = {}) => {
  const {
    departmentId,
    departmentIds = [],
    sbuId,
    sbuIds = [],
    search,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = params;
  const pagination = calculatePagination(page, limit);

  const filter = { isValid: true };
  const scopedDepartmentObjectIds = toObjectIdList(
    resolveScopeIds(departmentId, departmentIds)
  );
  const scopedSbuObjectIds = toObjectIdList(resolveScopeIds(sbuId, sbuIds));

  if (scopedDepartmentObjectIds.length === 1) {
    filter.departmentId = scopedDepartmentObjectIds[0];
  } else if (scopedDepartmentObjectIds.length > 1) {
    filter.departmentId = { $in: scopedDepartmentObjectIds };
  }
  if (scopedSbuObjectIds.length === 1) {
    filter.sbuId = scopedSbuObjectIds[0];
  } else if (scopedSbuObjectIds.length > 1) {
    filter.sbuId = { $in: scopedSbuObjectIds };
  }

  // Date range filter
  if (startDate || endDate) {
    filter.submittedAt = {};
    if (startDate) filter.submittedAt.$gte = new Date(startDate);
    if (endDate) filter.submittedAt.$lte = new Date(endDate);
  }

  // Build query - search will be handled separately
  let query = CSATResponse.find(filter)
    .populate(RESPONSE_POPULATIONS.brand)
    .populate(RESPONSE_POPULATIONS.client)
    .populate(RESPONSE_POPULATIONS.department)
    .populate(RESPONSE_POPULATIONS.cycle)
    .populate(RESPONSE_POPULATIONS.sbu)
    .sort({ submittedAt: -1 });

  // If search is provided, we need to do a more complex query
  if (search) {
    // Find matching brands
    const matchingBrands = await Brand.find({
      name: { $regex: search, $options: 'i' },
    }).select('_id');

    // Find matching clients
    const matchingClients = await mongoose
      .model('Client')
      .find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      })
      .select('_id');

    filter.$or = [
      { brandId: { $in: matchingBrands.map(b => b._id) } },
      { clientId: { $in: matchingClients.map(c => c._id) } },
      { comment: { $regex: search, $options: 'i' } },
    ];

    query = CSATResponse.find(filter)
      .populate(RESPONSE_POPULATIONS.brand)
      .populate(RESPONSE_POPULATIONS.client)
      .populate(RESPONSE_POPULATIONS.department)
      .populate(RESPONSE_POPULATIONS.cycle)
      .populate(RESPONSE_POPULATIONS.sbu)
      .sort({ submittedAt: -1 });
  }

  const [responses, total] = await Promise.all([
    query.skip(pagination.skip).limit(pagination.limit).lean(),
    CSATResponse.countDocuments(filter),
  ]);

  return {
    responses: enrichResponsesWithScores(responses),
    pagination: buildPaginationResponse(
      pagination.page,
      pagination.limit,
      total
    ),
  };
};

/**
 * Global search across all historical CSAT data
 * Ignores current cycle filter, searches all data grouped by cycle
 * @param {string} searchTerm - Search term
 * @param {Object} options - Options (limit)
 * @returns {Promise<Object>} Search results grouped by cycle
 */
export const globalSearch = async (searchTerm, options = {}) => {
  const { limit = 100, sbuId, sbuIds = [], departmentIds = [] } = options;

  if (!searchTerm || searchTerm.trim().length < 2) {
    return { results: [], total: 0, groupedByCycle: [] };
  }

  const scopedSbuObjectIds = toObjectIdList(resolveScopeIds(sbuId, sbuIds));
  const scopedDepartmentObjectIds = toObjectIdList(departmentIds);

  // Find matching brands
  const matchingBrands = await Brand.find({
    name: { $regex: searchTerm, $options: 'i' },
  }).select('_id name');

  // Find matching clients
  const Client = mongoose.model('Client');
  const matchingClients = await Client.find({
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { phone: { $regex: searchTerm, $options: 'i' } },
    ],
  }).select('_id name phone');

  // Build search filter
  const searchFilter = {
    isValid: true,
    $or: [
      { brandId: { $in: matchingBrands.map(b => b._id) } },
      { clientId: { $in: matchingClients.map(c => c._id) } },
      { comment: { $regex: searchTerm, $options: 'i' } },
    ],
  };
  if (scopedSbuObjectIds.length > 0) {
    searchFilter.sbuId = { $in: scopedSbuObjectIds };
  }
  if (scopedDepartmentObjectIds.length > 0) {
    searchFilter.departmentId = { $in: scopedDepartmentObjectIds };
  }

  // Get responses grouped by cycle
  const responses = await CSATResponse.find(searchFilter)
    .populate(RESPONSE_POPULATIONS.brand)
    .populate(RESPONSE_POPULATIONS.client)
    .populate(RESPONSE_POPULATIONS.department)
    .populate(RESPONSE_POPULATIONS.cycle)
    .populate(RESPONSE_POPULATIONS.sbu)
    .sort({ 'cycleId.year': -1, 'cycleId.cycleNumber': -1, submittedAt: -1 })
    .limit(parseInt(limit))
    .lean();

  // Group by cycle
  const cycleGroups = {};
  responses.forEach(resp => {
    const cycleKey = resp.cycleId?._id?.toString() || 'unknown';
    if (!cycleGroups[cycleKey]) {
      cycleGroups[cycleKey] = {
        cycle: resp.cycleId,
        responses: [],
        avgScore: 0,
      };
    }
    cycleGroups[cycleKey].responses.push({
      _id: resp._id,
      brand: resp.brandId?.name,
      department: resp.departmentId?.name,
      sbu: resp.sbuId?.name,
      poc: resp.clientId?.name,
      submittedAt: resp.submittedAt,
      score: extractQuickScores(resp).score,
      comment: resp.comment,
    });
  });

  // Calculate average scores per cycle
  const groupedByCycle = Object.values(cycleGroups).map(group => {
    const scores = group.responses
      .map(r => r.score)
      .filter(s => s !== undefined);
    group.avgScore =
      scores.length > 0
        ? Math.round(
          (scores.reduce((a, b) => a + b, 0) / scores.length) * 100
        ) / 100
        : 0;
    group.responseCount = group.responses.length;
    return group;
  });

  // Sort by year and cycle number descending
  groupedByCycle.sort((a, b) => {
    if (a.cycle?.year !== b.cycle?.year)
      return (b.cycle?.year || 0) - (a.cycle?.year || 0);
    return (b.cycle?.cycleNumber || 0) - (a.cycle?.cycleNumber || 0);
  });

  return {
    searchTerm,
    total: responses.length,
    groupedByCycle,
  };
};

/**
 * Global search across all entities - SBUs, Brands, Clients, and CSAT Responses
 * Returns results in ordered priority: SBUs → Brands → Clients → CSAT Responses
 * 
 * @param {string} searchTerm - Search term (minimum 2 characters)
 * @param {Object} options - Options
 * @param {number} options.limit - Maximum results per category (default: 10)
 * @param {string} options.cycleId - Optional cycle filter for CSAT responses
 * @param {string} options.departmentId - Optional department filter
 * @returns {Promise<Object>} Search results grouped by entity type
 */
export const globalSearchEntities = async (searchTerm, options = {}) => {
  const {
    limit = 10,
    cycleId,
    departmentId,
    sbuId,
    sbuIds = [],
    departmentIds = [],
  } = options;

  if (!searchTerm || searchTerm.trim().length < 2) {
    return {
      searchTerm: '',
      totalResults: 0,
      sbus: { results: [], count: 0 },
      brands: { results: [], count: 0 },
      clients: { results: [], count: 0 },
      csatResponses: { results: [], count: 0 },
    };
  }

  const searchRegex = { $regex: searchTerm, $options: 'i' };
  const parsedLimit = parseInt(limit) || 10;
  const toUniqueObjectIds = values =>
    [...new Set((values || []).map(value => String(value).trim()).filter(Boolean))]
      .map(toObjectId)
      .filter(Boolean);

  const scopedSbuObjectIds = toUniqueObjectIds(
    sbuId ? [sbuId, ...sbuIds] : sbuIds
  );
  const scopedDepartmentObjectIds = toUniqueObjectIds(departmentIds);
  const requestedDepartmentObjectId = departmentId ? toObjectId(departmentId) : null;

  const departmentNameFilterId = requestedDepartmentObjectId || null;
  let requestedDepartmentCode = null;
  if (departmentNameFilterId) {
    const departmentRecord = await Department.findById(departmentNameFilterId)
      .select('name')
      .lean();
    requestedDepartmentCode = departmentRecord?.name || null;
  }

  let scopedDepartmentCodes = [];
  if (scopedDepartmentObjectIds.length > 0) {
    const scopedDepartments = await Department.find({
      _id: { $in: scopedDepartmentObjectIds },
      isActive: true,
    })
      .select('name')
      .lean();

    scopedDepartmentCodes = [
      ...new Set(scopedDepartments.map(department => department.name).filter(Boolean)),
    ];
  }

  let scopedBrandIds = null;
  const brandScopeClauses = [];
  if (scopedDepartmentCodes.length > 0) {
    brandScopeClauses.push({
      'services.department': { $in: scopedDepartmentCodes },
    });
  }
  if (scopedSbuObjectIds.length > 0) {
    brandScopeClauses.push({
      'services.sbuId': { $in: scopedSbuObjectIds },
    });
  }

  if (brandScopeClauses.length > 0) {
    const brandScopeQuery = { isActive: true };
    if (brandScopeClauses.length === 1) {
      Object.assign(brandScopeQuery, brandScopeClauses[0]);
    } else {
      brandScopeQuery.$or = brandScopeClauses;
    }

    scopedBrandIds = (await Brand.find(brandScopeQuery).select('_id').lean()).map(
      brand => brand._id
    );
  }

  // 1. Search SBUs
  const sbuQuery = {
    isActive: true,
    $or: [
      { name: searchRegex },
      { slug: searchRegex },
      { executiveVP: searchRegex },
      { associateVP: searchRegex },
      { associateVPs: searchRegex },
      { creativeDirector: searchRegex },
      { leadNames: searchRegex },
    ],
  };

  if (requestedDepartmentObjectId) {
    sbuQuery.departmentId = requestedDepartmentObjectId;
  } else if (scopedDepartmentObjectIds.length > 0) {
    sbuQuery.departmentId = { $in: scopedDepartmentObjectIds };
  }
  if (scopedSbuObjectIds.length > 0) {
    sbuQuery._id = { $in: scopedSbuObjectIds };
  }

  const [sbuResults, sbuTotalCount] = await Promise.all([
    SBU.find(sbuQuery)
      .populate('departmentId', 'name displayName')
      .populate('brands', 'name slug')
      .select('name slug executiveVP associateVP associateVPs creativeDirector leadNames departmentId brands isActive')
      .limit(parsedLimit)
      .lean(),
    SBU.countDocuments(sbuQuery),
  ]);

  const formattedSBUs = sbuResults.map(sbu => ({
    _id: sbu._id,
    name: sbu.name,
    slug: sbu.slug,
    department: sbu.departmentId?.displayName || sbu.departmentId?.name,
    departmentId: sbu.departmentId?._id,
    executiveVP: sbu.executiveVP,
    associateVP: sbu.associateVP,
    associateVPs: sbu.associateVPs,
    creativeDirector: sbu.creativeDirector,
    leadNames: sbu.leadNames,
    brandCount: sbu.brands?.length || 0,
    entityType: 'sbu',
  }));

  // 2. Search Brands
  const brandQuery = {
    isActive: true,
    $or: [
      { name: searchRegex },
      { slug: searchRegex },
    ],
  };

  if (requestedDepartmentCode) {
    brandQuery['services.department'] = requestedDepartmentCode;
  } else if (scopedDepartmentCodes.length > 0) {
    brandQuery['services.department'] = { $in: scopedDepartmentCodes };
  }
  if (scopedSbuObjectIds.length > 0) {
    brandQuery['services.sbuId'] = { $in: scopedSbuObjectIds };
  }

  const [brandResults, brandTotalCount] = await Promise.all([
    Brand.find(brandQuery)
      .populate({
        path: 'services.sbuId',
        select: 'name slug',
      })
      .select('name slug services secondBrainId isActive')
      .limit(parsedLimit)
      .lean(),
    Brand.countDocuments(brandQuery),
  ]);

  const formattedBrands = brandResults.map(brand => ({
    _id: brand._id,
    name: brand.name,
    slug: brand.slug,
    services: brand.services?.map(s => ({
      department: s.department,
      sbu: s.sbuId?.name,
      sbuId: s.sbuId?._id,
      isActive: s.isActive,
    })) || [],
    secondBrainId: brand.secondBrainId,
    entityType: 'brand',
  }));

  // 3. Search Clients (POCs)
  // First search by client name/phone/email
  const clientQuery = {
    isActive: true,
    $or: [
      { name: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
    ],
  };

  // Also search for clients by brand name
  const matchingBrandsForClients = await Brand.find({
    name: searchRegex,
    isActive: true,
    ...(scopedBrandIds ? { _id: { $in: scopedBrandIds } } : {}),
  }).select('_id');

  if (matchingBrandsForClients.length > 0) {
    clientQuery.$or.push({ brandId: { $in: matchingBrandsForClients.map(b => b._id) } });
  }

  if (requestedDepartmentCode) {
    clientQuery['serviceMapping.department'] = requestedDepartmentCode;
  } else if (scopedDepartmentCodes.length > 0) {
    clientQuery['serviceMapping.department'] = { $in: scopedDepartmentCodes };
  }
  if (scopedBrandIds) {
    clientQuery.brandId = { $in: scopedBrandIds };
  }

  const [clientResults, clientTotalCount] = await Promise.all([
    Client.find(clientQuery)
      .populate('brandId', 'name slug')
      .select('name phone email brandId serviceMapping isActive')
      .limit(parsedLimit)
      .lean(),
    Client.countDocuments(clientQuery),
  ]);

  const formattedClients = clientResults.map(client => ({
    _id: client._id,
    name: client.name,
    phone: client.phone,
    email: client.email,
    brand: client.brandId?.name,
    brandSlug: client.brandId?.slug,
    brandId: client.brandId?._id,
    serviceMapping: client.serviceMapping,
    entityType: 'client',
  }));

  // 4. Search CSAT Responses
  // Find brands and clients matching the search for response search
  const [matchingBrandsForResponses, matchingClientsForResponses] = await Promise.all([
    Brand.find({
      name: searchRegex,
      ...(scopedBrandIds ? { _id: { $in: scopedBrandIds } } : {}),
    }).select('_id'),
    Client.find({
      $or: [
        { name: searchRegex },
        { phone: searchRegex },
      ],
      ...(scopedBrandIds ? { brandId: { $in: scopedBrandIds } } : {}),
    }).select('_id'),
  ]);

  const responseFilter = {
    isValid: true,
    $or: [
      { brandId: { $in: matchingBrandsForResponses.map(b => b._id) } },
      { clientId: { $in: matchingClientsForResponses.map(c => c._id) } },
      { comment: searchRegex },
    ],
  };

  if (cycleId) {
    responseFilter.cycleId = toObjectId(cycleId);
  }

  if (requestedDepartmentObjectId) {
    responseFilter.departmentId = requestedDepartmentObjectId;
  } else if (scopedDepartmentObjectIds.length > 0) {
    responseFilter.departmentId = { $in: scopedDepartmentObjectIds };
  }
  if (scopedSbuObjectIds.length > 0) {
    responseFilter.sbuId = { $in: scopedSbuObjectIds };
  }

  const [responseResults, responseTotalCount] = await Promise.all([
    CSATResponse.find(responseFilter)
      .populate(RESPONSE_POPULATIONS.brand)
      .populate(RESPONSE_POPULATIONS.client)
      .populate(RESPONSE_POPULATIONS.department)
      .populate(RESPONSE_POPULATIONS.cycle)
      .populate(RESPONSE_POPULATIONS.sbu)
      .sort({ submittedAt: -1 })
      .limit(parsedLimit)
      .lean(),
    CSATResponse.countDocuments(responseFilter),
  ]);

  const formattedResponses = enrichResponsesWithScores(responseResults).map(resp => ({
    _id: resp._id,
    brand: resp.brandId?.name,
    brandSlug: resp.brandId?.slug,
    brandId: resp.brandId?._id,
    client: resp.clientId?.name,
    clientPhone: resp.clientId?.phone,
    clientId: resp.clientId?._id,
    department: resp.departmentId?.displayName || resp.departmentId?.name,
    departmentId: resp.departmentId?._id,
    sbu: resp.sbuId?.name,
    sbuId: resp.sbuId?._id,
    cycle: resp.cycleId?.name,
    cycleId: resp.cycleId?._id,
    year: resp.cycleId?.year,
    cycleNumber: resp.cycleId?.cycleNumber,
    submittedAt: resp.submittedAt,
    csatScore: resp.csatScore,
    npsScore: resp.npsScore,
    comment: resp.comment,
    entityType: 'csatResponse',
  }));

  const totalResults = sbuTotalCount + brandTotalCount + clientTotalCount + responseTotalCount;

  return {
    searchTerm,
    totalResults,
    sbus: {
      results: formattedSBUs,
      count: formattedSBUs.length,
      totalCount: sbuTotalCount,
      hasMore: sbuTotalCount > parsedLimit,
    },
    brands: {
      results: formattedBrands,
      count: formattedBrands.length,
      totalCount: brandTotalCount,
      hasMore: brandTotalCount > parsedLimit,
    },
    clients: {
      results: formattedClients,
      count: formattedClients.length,
      totalCount: clientTotalCount,
      hasMore: clientTotalCount > parsedLimit,
    },
    csatResponses: {
      results: formattedResponses,
      count: formattedResponses.length,
      totalCount: responseTotalCount,
      hasMore: responseTotalCount > parsedLimit,
    },
  };
};

/**
 * Get department records table (POC details)
 * @param {string} departmentId - Department ObjectId
 * @param {Object} params - Filter parameters (cycleId, year, search, page, limit)
 * @returns {Promise<Object>} Department records with POC details
 */
export const getDepartmentRecords = async (departmentId, params = {}) => {
  const {
    cycleId,
    year,
    search,
    page = 1,
    limit = 50,
    sbuId,
    sbuIds = [],
  } = params;
  const pagination = calculatePagination(page, limit);

  const filter = await buildFilterWithYear({
    departmentId,
    cycleId,
    year,
    sbuId,
    sbuIds,
  });

  // If search provided, add search conditions
  if (search) {
    const matchingBrands = await Brand.find({
      name: { $regex: search, $options: 'i' },
    }).select('_id');

    const Client = mongoose.model('Client');
    const matchingClients = await Client.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');

    filter.$or = [
      { brandId: { $in: matchingBrands.map(b => b._id) } },
      { clientId: { $in: matchingClients.map(c => c._id) } },
    ];
  }

  const [responses, total, department] = await Promise.all([
    CSATResponse.find(filter)
      .populate({ path: 'brandId', select: 'name slug' })
      .populate({ path: 'clientId', select: 'name phone email' })
      .populate({ path: 'sbuId', select: 'name leadNames' })
      .populate({ path: 'cycleId', select: 'name cycleNumber year' })
      .sort({ submittedAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    CSATResponse.countDocuments(filter),
    Department.findById(departmentId).select('name').lean(),
  ]);

  // Format response for table display
  const records = responses.map(resp => ({
    _id: resp._id,
    brand: resp.brandId?.name,
    brandSlug: resp.brandId?.slug,
    poc: resp.clientId?.name,
    phone: resp.clientId?.phone,
    email: resp.clientId?.email,
    sbu: resp.sbuId?.name,
    spoc: resp.sbuId?.leadNames?.join(', '),
    cycle: resp.cycleId?.name,
    year: resp.cycleId?.year,
    submittedAt: resp.submittedAt,
    score: extractQuickScores(resp).score,
    nps: extractQuickScores(resp).nps,
    comment: resp.comment,
  }));

  return {
    department,
    records,
    pagination: buildPaginationResponse(
      pagination.page,
      pagination.limit,
      total
    ),
  };
};

/**
 * Get SBU detail page with individual responses
 * @param {string} sbuId - SBU ObjectId
 * @param {Object} params - Filter parameters (cycleId, year, search, startDate, endDate, departmentId, page, limit)
 * @returns {Promise<Object>} SBU detail with responses
 */
export const getSBUDetail = async (sbuId, params = {}) => {
  const {
    cycleId,
    year,
    search,
    startDate,
    endDate,
    departmentId,
    page = 1,
    limit = 50,
  } = params;
  const pagination = calculatePagination(page, limit);

  const filter = await buildFilterWithYear({ cycleId, year, departmentId });
  filter.sbuId = toObjectId(sbuId);

  // Date range filter
  if (startDate || endDate) {
    filter.submittedAt = {};
    if (startDate) filter.submittedAt.$gte = new Date(startDate);
    if (endDate) filter.submittedAt.$lte = new Date(endDate);
  }

  // Search filter
  if (search) {
    const matchingBrands = await Brand.find({
      name: { $regex: search, $options: 'i' },
    }).select('_id');

    const Client = mongoose.model('Client');
    const matchingClients = await Client.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');

    filter.$or = [
      { brandId: { $in: matchingBrands.map(b => b._id) } },
      { clientId: { $in: matchingClients.map(c => c._id) } },
      { comment: { $regex: search, $options: 'i' } },
    ];
  }

  // Get SBU info with stats
  const [sbu, responses, total, stats] = await Promise.all([
    SBU.findById(sbuId)
      .populate('departmentId', 'name')
      .populate('brands', 'name slug')
      .lean(),
    CSATResponse.find(filter)
      .populate({ path: 'brandId', select: 'name slug' })
      .populate({ path: 'clientId', select: 'name phone email' })
      .populate({ path: 'departmentId', select: 'name' })
      .populate({ path: 'cycleId', select: 'name cycleNumber year' })
      .sort({ submittedAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    CSATResponse.countDocuments(filter),
    CSATResponse.aggregate([
      { $match: filter },
      ...getScoreNormalizationStages(),
      {
        $group: {
          _id: null,
          avgCsat: { $avg: '$_csatScore' },
          avgNps: { $avg: '$_npsScore' },
          totalResponses: { $sum: 1 },
          uniqueBrands: { $addToSet: '$brandId' },
        },
      },
      {
        $project: {
          _id: 0,
          avgCsat: { $round: ['$avgCsat', 2] },
          avgNps: { $round: ['$avgNps', 2] },
          totalResponses: 1,
          brandCount: { $size: '$uniqueBrands' },
        },
      },
    ]),
  ]);

  // Format responses for table display
  const formattedResponses = responses.map(resp => ({
    _id: resp._id,
    department: resp.departmentId?.name,
    brand: resp.brandId?.name,
    brandSlug: resp.brandId?.slug,
    poc: resp.clientId?.name,
    phone: resp.clientId?.phone,
    email: resp.clientId?.email,
    cycle: resp.cycleId?.name,
    year: resp.cycleId?.year,
    submittedAt: resp.submittedAt,
    csatScore: extractQuickScores(resp).score,
    npsScore: extractQuickScores(resp).nps,
    comment: resp.comment,
  }));

  return {
    sbu: {
      _id: sbu?._id,
      name: sbu?.name,
      department: sbu?.departmentId?.name,
      executiveVP: sbu?.executiveVP,
      associateVP: sbu?.associateVP,
      associateVPs: sbu?.associateVPs,
      creativeDirector: sbu?.creativeDirector,
      leadNames: sbu?.leadNames,
      brandCount: sbu?.brands?.length || 0,
    },
    stats: stats[0] || {
      avgCsat: 0,
      avgNps: 0,
      totalResponses: 0,
      brandCount: 0,
    },
    responses: formattedResponses,
    pagination: buildPaginationResponse(
      pagination.page,
      pagination.limit,
      total
    ),
  };
};

/**
 * Get BI Export data for all departments
 * GET /api/v1/dashboard/bi-export
 * 
 * Required Query Parameters:
 * - cycleId: Cycle ObjectId
 * 
 * Optional Query Parameters:
 * - departmentId: Filter by specific department (optional)
 * 
 * Returns all CSAT responses for all departments (or specific department) grouped by department
 */
export const getBIExport = async (params = {}) => {
  const {
    cycleId,
    departmentId = null,
    departmentIds = [],
    sbuIds = [],
  } = params;

  const scopedDepartmentIds = [...new Set((departmentIds || []).filter(Boolean))];
  const scopedSbuIds = [...new Set((sbuIds || []).filter(Boolean))];

  // Get cycle info
  const cycle = await Cycle.findById(cycleId)
    .select('name cycleNumber year status isFinalized')
    .lean();

  if (!cycle) {
    throw new Error('Cycle not found');
  }

  const cycleStatus = String(cycle.status || '').toLowerCase();
  const isOngoingCycle =
    cycle.isFinalized === true && cycleStatus === 'active';
  const useHistoricalModels =
    cycle.isFinalized === true &&
    ['closed', 'completed'].includes(cycleStatus);
  const useCurrentModels = isOngoingCycle || !useHistoricalModels;

  // Build filter for responses
  const responseFilter = {
    cycleId: toObjectId(cycleId),
    isValid: true,
  };

  // If departmentId provided, filter by it
  if (departmentId) {
    responseFilter.departmentId = toObjectId(departmentId);
  } else if (scopedDepartmentIds.length > 0) {
    responseFilter.departmentId = {
      $in: scopedDepartmentIds.map(id => toObjectId(id)),
    };
  }
  if (scopedSbuIds.length > 0) {
    responseFilter.sbuId = { $in: scopedSbuIds.map(id => toObjectId(id)) };
  }

  // Fetch all CSAT responses for this cycle (all departments or specific department)
  const responses = await CSATResponse.find(responseFilter)
    .populate('brandId', 'name slug')
    .populate('clientId', 'name phone email')
    .populate('sbuId', 'name slug')
    .populate('departmentId', 'name displayName')
    .populate('cycleId', 'name cycleNumber year')
    .sort({ 'departmentId.name': 1, 'sbuId.name': 1, 'brandId.name': 1 })
    .lean();

  // Enrich responses with calculated scores
  const enrichedResponses = enrichResponsesWithScores(responses);

  // Get all unique department IDs from responses
  const responseDepartmentIdStrings = [
    ...new Set(
      enrichedResponses
        .map(r => r.departmentId?._id?.toString())
        .filter(Boolean)
    ),
  ];

  // Fetch SBU histories for all departments in this cycle
  const sbuHistoriesMap = new Map();

  if (!useCurrentModels && responseDepartmentIdStrings.length > 0) {
    const sbuHistories = await SBUHistory.find({
      departmentId: { $in: responseDepartmentIdStrings.map(id => toObjectId(id)) },
      cycleId: toObjectId(cycleId),
    })
      .select('sbuId executiveVP associateVP associateVPs creativeDirector leadNames')
      .lean();

    sbuHistories.forEach((history) => {
      if (history.sbuId) {
        sbuHistoriesMap.set(history.sbuId.toString(), history);
      }
    });
  }

  // Enrich responses with historical SBU data if available
  const finalResponses = useCurrentModels
    ? enrichedResponses
    : enrichedResponses.map((response) => {
      if (response.sbuId && response.sbuId._id) {
        const sbuIdStr = response.sbuId._id.toString();
        const sbuHistory = sbuHistoriesMap.get(sbuIdStr);

        if (sbuHistory) {
          response.sbuId = {
            ...response.sbuId,
            executiveVP: sbuHistory.executiveVP,
            associateVP: sbuHistory.associateVP,
            associateVPs: sbuHistory.associateVPs || [],
            creativeDirector: sbuHistory.creativeDirector,
            leadNames: sbuHistory.leadNames || [],
          };
        }
      }
      return response;
    });

  // Get department summary
  const responseDepartmentIds = [
    ...new Set(
      finalResponses
        .map(response => response.departmentId?._id?.toString())
        .filter(Boolean)
    ),
  ].map(id => toObjectId(id));

  const departmentQuery = departmentId
    ? { _id: toObjectId(departmentId) }
    : scopedDepartmentIds.length > 0
      ? { _id: { $in: scopedDepartmentIds.map(id => toObjectId(id)) } }
      : scopedSbuIds.length > 0
        ? { _id: { $in: responseDepartmentIds } }
        : {};

  const departments = await Department.find(departmentQuery)
    .select('name displayName')
    .lean();

  return {
    cycle: {
      id: cycle._id,
      name: cycle.name,
      cycleNumber: cycle.cycleNumber,
      year: cycle.year,
    },
    totalResponses: finalResponses.length,
    departments: departments.map(dept => ({
      id: dept._id,
      name: dept.displayName || dept.name,
    })),
    responses: finalResponses,
  };
};

/**
 * Get SBU brands coverage report
 * Shows which brands are under each SBU, their services, and which departments filled CSAT
 * GET /api/v1/dashboard/sbu-brands-coverage
 * 
 * Required Query Parameters:
 * - cycleId: Cycle ObjectId
 * 
 * Returns SBUs with their brands, services taken, and departments that filled CSAT
 * 
 * NOTE: If cycle is active, fetches from current models (SBU, Brand)
 *       If cycle is closed/completed, fetches from history models (SBUHistory, BrandHistory)
 */
export const getSBUBrandsCoverage = async (params = {}) => {
  const {
    cycleId,
    sbuIds = [],
    departmentIds = [],
  } = params;

  const scopedSbuIds = [...new Set((sbuIds || []).filter(Boolean))];
  const scopedDepartmentIds = [...new Set((departmentIds || []).filter(Boolean))];
  const scopedSbuObjectIds = scopedSbuIds.map(id => toObjectId(id));
  const scopedDepartmentObjectIds = scopedDepartmentIds.map(id =>
    toObjectId(id)
  );

  // Get cycle info
  const cycle = await Cycle.findById(cycleId)
    .select('name cycleNumber year status isFinalized')
    .lean();

  if (!cycle) {
    throw new Error('Cycle not found');
  }

  const cycleStatus = String(cycle.status || '').toLowerCase();
  const isOngoingCycle =
    cycle.isFinalized === true && cycleStatus === 'active';
  const isHistoricalSnapshotCycle =
    cycle.isFinalized === true &&
    ['closed', 'completed'].includes(cycleStatus);
  const useCurrentModels = isOngoingCycle || !isHistoricalSnapshotCycle;

  // Process each SBU
  const sbuResults = [];

  // --------------------------------------------------------
  // Shared helper: assemble per-brand data from pre-fetched maps
  // --------------------------------------------------------
  const assembleBrandData = ({
    brandId, brandName, brandSlug, services,
    sbuIdStr, departmentCode,
    responseMap, departmentMap, clientMap,
  }) => {
    // Restrict services to the current SBU context only.
    const filteredServices = (services || []).filter(service => {
      const serviceDepartment = service?.department?.toLowerCase();
      const serviceSbuId = service?.sbuId ? String(service.sbuId) : null;
      return (
        (departmentCode && serviceDepartment === departmentCode) ||
        (serviceSbuId && serviceSbuId === sbuIdStr)
      );
    });

    const departmentsTaken = [...new Set(filteredServices.map(s => s.department).filter(Boolean))];

    // Get responses for this sbu+brand combination
    const key = `${sbuIdStr}:${String(brandId)}`;
    const csatResponses = responseMap.get(key) || [];

    const filledDepartmentCodes = new Set(
      csatResponses.map(r => {
        const dept = departmentMap.get(String(r.departmentId));
        return dept?.name?.toLowerCase();
      }).filter(Boolean)
    );

    const departmentsFilled = [...new Set(
      csatResponses.map(r => {
        const dept = departmentMap.get(String(r.departmentId));
        return dept?.displayName || dept?.name;
      }).filter(Boolean)
    )];

    const servicesDetail = departmentsTaken.map(deptCode => {
      const serviceEntry = filteredServices.find(s => s.department === deptCode);
      const deptDisplayName = getDepartmentDisplayName(deptCode);
      const isFilled = filledDepartmentCodes.has(String(deptCode).toLowerCase());

      return {
        department: deptDisplayName,
        departmentCode: deptCode,
        isActive: serviceEntry?.isActive || false,
        isFilled,
        startDate: serviceEntry?.startDate,
        endDate: serviceEntry?.endDate,
      };
    });

    const allClients = clientMap.get(String(brandId)) || [];

    const filledClientIds = new Set(
      csatResponses.map(r => String(r.clientId)).filter(Boolean)
    );

    const clientsFilled = allClients.filter(c => filledClientIds.has(String(c.clientId)));
    const clientsUnfilled = allClients.filter(c => !filledClientIds.has(String(c.clientId)));

    return {
      brandId,
      brandName,
      slug: brandSlug,
      totalServices: servicesDetail.length,
      servicesFilled: servicesDetail.filter(s => s.isFilled).length,
      servicesUnfilled: servicesDetail.filter(s => !s.isFilled).length,
      services: servicesDetail,
      departmentsFilled,
      totalClients: allClients.length,
      clientsFilledCount: clientsFilled.length,
      clientsUnfilledCount: clientsUnfilled.length,
      clientsFilled,
      clientsUnfilled,
    };
  };

  const buildSbuResult = ({ sbuId, sbuName, sbuSlug, departmentName, leadership, brandsData }) => {
    const totalBrands = brandsData.length;
    const totalServicesTaken = brandsData.reduce((sum, b) => sum + b.totalServices, 0);
    const totalServicesFilled = brandsData.reduce((sum, b) => sum + b.servicesFilled, 0);
    const totalServicesUnfilled = brandsData.reduce((sum, b) => sum + b.servicesUnfilled, 0);

    return {
      sbuId,
      sbuName,
      sbuSlug,
      department: departmentName,
      leadership,
      summary: {
        totalBrands,
        totalServicesTaken,
        totalServicesFilled,
        totalServicesUnfilled,
        fillRate: totalServicesTaken > 0
          ? Math.round((totalServicesFilled / totalServicesTaken) * 100)
          : 0,
      },
      brands: brandsData.sort((a, b) => a.brandName.localeCompare(b.brandName)),
    };
  };

  if (useCurrentModels) {
    // ========================================
    // ACTIVE CYCLE: Use current models (batched)
    // ========================================

    const sbuQuery = { isActive: true };
    if (scopedSbuObjectIds.length > 0) {
      sbuQuery._id = { $in: scopedSbuObjectIds };
    }
    if (scopedDepartmentObjectIds.length > 0) {
      sbuQuery.departmentId = { $in: scopedDepartmentObjectIds };
    }

    const sbus = await SBU.find(sbuQuery)
      .populate('departmentId', 'name displayName')
      .select('name slug departmentId brands executiveVP associateVP associateVPs creativeDirector leadNames')
      .lean();

    if (sbus.length === 0) {
      return {
        cycle: { id: cycle._id, name: cycle.name, cycleNumber: cycle.cycleNumber, year: cycle.year, status: cycle.status },
        dataSource: 'current',
        sbus: [],
        totalSBUs: 0,
        totalBrands: 0,
      };
    }

    // --- Batch query 1: ALL CSAT responses for all SBUs in one go ---
    const allSbuObjectIds = sbus.map(s => s._id);
    const allResponses = await CSATResponse.find({
      cycleId: toObjectId(cycleId),
      sbuId: { $in: allSbuObjectIds },
      isValid: true,
    })
      .select('brandId sbuId departmentId clientId')
      .lean();

    // Build response lookup: sbuId:brandId -> [responses]
    // Also track response-derived brandIds per SBU
    const responseMap = new Map();
    const responseBrandsBySbu = new Map(); // sbuId -> Set<brandIdStr>
    const allDepartmentIds = new Set();

    for (const r of allResponses) {
      const sKey = String(r.sbuId);
      const bKey = String(r.brandId);
      const compositeKey = `${sKey}:${bKey}`;

      if (!responseMap.has(compositeKey)) responseMap.set(compositeKey, []);
      responseMap.get(compositeKey).push(r);

      if (!responseBrandsBySbu.has(sKey)) responseBrandsBySbu.set(sKey, new Set());
      responseBrandsBySbu.get(sKey).add(bKey);

      if (r.departmentId) allDepartmentIds.add(String(r.departmentId));
    }

    // --- Batch query 2: ALL departments referenced in responses ---
    const departments = allDepartmentIds.size > 0
      ? await Department.find({ _id: { $in: [...allDepartmentIds].map(id => toObjectId(id)) } })
        .select('name displayName')
        .lean()
      : [];
    const departmentMap = new Map(departments.map(d => [String(d._id), d]));

    // Collect all unique brandIds (from SBU.brands + response-derived)
    const allBrandIdSet = new Set();
    for (const sbu of sbus) {
      for (const bId of (sbu.brands || [])) {
        if (bId) allBrandIdSet.add(String(bId));
      }
      const responseBrands = responseBrandsBySbu.get(String(sbu._id));
      if (responseBrands) {
        for (const bId of responseBrands) allBrandIdSet.add(bId);
      }
    }
    const allBrandObjectIds = [...allBrandIdSet].map(id => toObjectId(id)).filter(Boolean);

    // --- Batch query 3: ALL brands in one go ---
    const allBrands = allBrandObjectIds.length > 0
      ? await Brand.find({ _id: { $in: allBrandObjectIds }, isActive: true })
        .select('name slug services isActive')
        .lean()
      : [];
    const brandMap = new Map(allBrands.map(b => [String(b._id), b]));

    // --- Batch query 4: ALL clients for all brands in one go ---
    const allClients = allBrandObjectIds.length > 0
      ? await Client.find({ brandId: { $in: allBrandObjectIds }, isActive: true })
        .select('name phone email serviceMapping brandId')
        .lean()
      : [];

    // Build client lookup: brandId -> [formatted clients]
    const clientMap = new Map();
    for (const client of allClients) {
      const bKey = String(client.brandId);
      if (!clientMap.has(bKey)) clientMap.set(bKey, []);
      clientMap.get(bKey).push({
        clientId: client._id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        serviceMapping: client.serviceMapping || [],
      });
    }

    // --- Assemble results in-memory (zero additional DB queries) ---
    for (const sbu of sbus) {
      const sbuIdStr = String(sbu._id);
      const departmentCode = sbu.departmentId?.name?.toLowerCase() || null;

      // Determine brand IDs for this SBU
      let sbuBrandIds = [...new Set(
        (sbu.brands || []).map(id => String(id)).filter(Boolean)
      )];
      if (sbuBrandIds.length === 0) {
        sbuBrandIds = [...(responseBrandsBySbu.get(sbuIdStr) || [])];
      }

      // Filter clients by department if needed
      const sbuClientMap = new Map();
      for (const bIdStr of sbuBrandIds) {
        const brandClients = clientMap.get(bIdStr) || [];
        if (departmentCode) {
          sbuClientMap.set(bIdStr, brandClients.filter(c =>
            (c.serviceMapping || []).some(
              sm => sm.department === departmentCode && sm.isActive
            )
          ));
        } else {
          sbuClientMap.set(bIdStr, brandClients);
        }
      }

      const brandsData = [];
      for (const bIdStr of sbuBrandIds) {
        const brand = brandMap.get(bIdStr);
        if (!brand) continue;

        brandsData.push(assembleBrandData({
          brandId: brand._id,
          brandName: brand.name,
          brandSlug: brand.slug,
          services: brand.services,
          sbuIdStr,
          departmentCode,
          responseMap,
          departmentMap,
          clientMap: sbuClientMap,
        }));
      }

      sbuResults.push(buildSbuResult({
        sbuId: sbu._id,
        sbuName: sbu.name,
        sbuSlug: sbu.slug,
        departmentName: sbu.departmentId?.displayName || sbu.departmentId?.name,
        leadership: {
          executiveVP: sbu.executiveVP,
          associateVP: sbu.associateVP,
          associateVPs: sbu.associateVPs || [],
          creativeDirector: sbu.creativeDirector,
          leadNames: sbu.leadNames || [],
        },
        brandsData,
      }));
    }

  } else {
    // ========================================
    // CLOSED/COMPLETED CYCLE: Use history models (batched)
    // ========================================

    const sbuHistoryQuery = { cycleId: toObjectId(cycleId) };
    if (scopedSbuObjectIds.length > 0) {
      sbuHistoryQuery.sbuId = { $in: scopedSbuObjectIds };
    }
    if (scopedDepartmentObjectIds.length > 0) {
      sbuHistoryQuery.departmentId = { $in: scopedDepartmentObjectIds };
    }

    const sbuHistories = await SBUHistory.find(sbuHistoryQuery)
      .populate('sbuId', 'name slug')
      .populate('departmentId', 'name displayName')
      .select('sbuId departmentId brands executiveVP associateVP associateVPs creativeDirector leadNames')
      .lean();

    if (sbuHistories.length === 0) {
      return {
        cycle: { id: cycle._id, name: cycle.name, cycleNumber: cycle.cycleNumber, year: cycle.year, status: cycle.status },
        dataSource: 'history',
        sbus: [],
        totalSBUs: 0,
        totalBrands: 0,
      };
    }

    // Collect all SBU IDs
    const allSbuObjectIds = sbuHistories
      .filter(sh => sh.sbuId?._id)
      .map(sh => sh.sbuId._id);

    // --- Batch query 1: ALL CSAT responses for all SBUs ---
    const allResponses = await CSATResponse.find({
      cycleId: toObjectId(cycleId),
      sbuId: { $in: allSbuObjectIds },
      isValid: true,
    })
      .select('brandId sbuId departmentId clientId')
      .lean();

    // Build response lookup maps
    const responseMap = new Map();
    const responseBrandsBySbu = new Map();
    const allDepartmentIds = new Set();

    for (const r of allResponses) {
      const sKey = String(r.sbuId);
      const bKey = String(r.brandId);
      const compositeKey = `${sKey}:${bKey}`;

      if (!responseMap.has(compositeKey)) responseMap.set(compositeKey, []);
      responseMap.get(compositeKey).push(r);

      if (!responseBrandsBySbu.has(sKey)) responseBrandsBySbu.set(sKey, new Set());
      responseBrandsBySbu.get(sKey).add(bKey);

      if (r.departmentId) allDepartmentIds.add(String(r.departmentId));
    }

    // --- Batch query 2: ALL departments ---
    const departments = allDepartmentIds.size > 0
      ? await Department.find({ _id: { $in: [...allDepartmentIds].map(id => toObjectId(id)) } })
        .select('name displayName')
        .lean()
      : [];
    const departmentMap = new Map(departments.map(d => [String(d._id), d]));

    // Collect all unique brandIds from history snapshots + response-derived
    const allBrandIdSet = new Set();
    const sbusMissingBrands = []; // SBUs whose history has no brands

    for (const sh of sbuHistories) {
      if (!sh.sbuId?._id) continue;
      const sbuIdStr = String(sh.sbuId._id);
      const historyBrands = (sh.brands || []).map(id => String(id)).filter(Boolean);

      if (historyBrands.length > 0) {
        for (const bId of historyBrands) allBrandIdSet.add(bId);
      } else {
        sbusMissingBrands.push(sbuIdStr);
      }

      const responseBrands = responseBrandsBySbu.get(sbuIdStr);
      if (responseBrands) {
        for (const bId of responseBrands) allBrandIdSet.add(bId);
      }
    }

    // --- Batch query 3: Live SBUs for those missing brands in history ---
    const liveSbuBrandsMap = new Map(); // sbuId -> brandIdStrings[]
    if (sbusMissingBrands.length > 0) {
      const liveSbus = await SBU.find({ _id: { $in: sbusMissingBrands.map(id => toObjectId(id)) } })
        .select('brands')
        .lean();
      for (const liveSbu of liveSbus) {
        const brands = (liveSbu.brands || []).map(id => String(id)).filter(Boolean);
        liveSbuBrandsMap.set(String(liveSbu._id), brands);
        for (const bId of brands) allBrandIdSet.add(bId);
      }
    }

    const allBrandObjectIds = [...allBrandIdSet].map(id => toObjectId(id)).filter(Boolean);

    // --- Batch query 4: ALL BrandHistories + fallback live brands ---
    const [brandHistoriesAll, allLiveBrands] = await Promise.all([
      allBrandObjectIds.length > 0
        ? BrandHistory.find({ cycleId: toObjectId(cycleId), brandId: { $in: allBrandObjectIds }, isActive: true })
          .populate('brandId', 'name slug')
          .select('brandId name services')
          .lean()
        : [],
      allBrandObjectIds.length > 0
        ? Brand.find({ _id: { $in: allBrandObjectIds }, isActive: true })
          .select('name slug services isActive')
          .lean()
        : [],
    ]);

    // Build brand lookup: brandId -> normalized brand row
    const brandHistoryMap = new Map();
    for (const bh of brandHistoriesAll) {
      if (bh.brandId?._id) {
        brandHistoryMap.set(String(bh.brandId._id), {
          brandId: bh.brandId._id,
          brandName: bh.name || bh.brandId.name,
          brandSlug: bh.brandId.slug,
          services: bh.services || [],
        });
      }
    }
    const liveBrandMap = new Map(allLiveBrands.map(b => [String(b._id), b]));

    // Merged brand lookup: prefer history, fallback to live
    const getBrandRow = (brandIdStr) => {
      if (brandHistoryMap.has(brandIdStr)) return brandHistoryMap.get(brandIdStr);
      const live = liveBrandMap.get(brandIdStr);
      if (live) return { brandId: live._id, brandName: live.name, brandSlug: live.slug, services: live.services || [] };
      return null;
    };

    // --- Batch query 5: ALL ClientHistories for all brands ---
    const allClientHistories = allBrandObjectIds.length > 0
      ? await ClientHistory.find({ cycleId: toObjectId(cycleId), brandId: { $in: allBrandObjectIds }, isActive: true })
        .select('clientId brandId name phone email serviceMapping')
        .lean()
      : [];

    const clientMap = new Map();
    for (const ch of allClientHistories) {
      const bKey = String(ch.brandId);
      if (!clientMap.has(bKey)) clientMap.set(bKey, []);
      clientMap.get(bKey).push({
        clientId: ch.clientId,
        name: ch.name,
        phone: ch.phone,
        email: ch.email,
        serviceMapping: ch.serviceMapping || [],
      });
    }

    // --- Assemble results in-memory ---
    for (const sbuHistory of sbuHistories) {
      if (!sbuHistory.sbuId) continue;

      const sbuIdStr = String(sbuHistory.sbuId._id);
      const departmentCode = sbuHistory.departmentId?.name?.toLowerCase() || null;

      // Determine brand IDs for this SBU
      let sbuBrandIds = [...new Set(
        (sbuHistory.brands || []).map(id => String(id)).filter(Boolean)
      )];

      // Fallback: live SBU brands (pre-fetched in batch query 3)
      if (sbuBrandIds.length === 0) {
        sbuBrandIds = liveSbuBrandsMap.get(sbuIdStr) || [];
      }

      // Fallback: response-derived brands
      if (sbuBrandIds.length === 0) {
        sbuBrandIds = [...(responseBrandsBySbu.get(sbuIdStr) || [])];
      }

      // Filter clients by department if needed
      const sbuClientMap = new Map();
      for (const bIdStr of sbuBrandIds) {
        const brandClients = clientMap.get(bIdStr) || [];
        if (departmentCode) {
          sbuClientMap.set(bIdStr, brandClients.filter(c =>
            (c.serviceMapping || []).some(
              sm => sm.department === departmentCode && sm.isActive
            )
          ));
        } else {
          sbuClientMap.set(bIdStr, brandClients);
        }
      }

      const brandsData = [];
      for (const bIdStr of sbuBrandIds) {
        const brandRow = getBrandRow(bIdStr);
        if (!brandRow) continue;

        brandsData.push(assembleBrandData({
          brandId: brandRow.brandId,
          brandName: brandRow.brandName,
          brandSlug: brandRow.brandSlug,
          services: brandRow.services,
          sbuIdStr,
          departmentCode,
          responseMap,
          departmentMap,
          clientMap: sbuClientMap,
        }));
      }

      sbuResults.push(buildSbuResult({
        sbuId: sbuHistory.sbuId._id,
        sbuName: sbuHistory.sbuId.name,
        sbuSlug: sbuHistory.sbuId.slug,
        departmentName: sbuHistory.departmentId?.displayName || sbuHistory.departmentId?.name,
        leadership: {
          executiveVP: sbuHistory.executiveVP,
          associateVP: sbuHistory.associateVP,
          associateVPs: sbuHistory.associateVPs || [],
          creativeDirector: sbuHistory.creativeDirector,
          leadNames: sbuHistory.leadNames || [],
        },
        brandsData,
      }));
    }
  }

  // Sort by SBU name
  sbuResults.sort((a, b) => a.sbuName.localeCompare(b.sbuName));

  // Calculate overall totals
  const totalBrands = sbuResults.reduce((sum, sbu) => sum + sbu.summary.totalBrands, 0);
  const totalServicesTaken = sbuResults.reduce((sum, sbu) => sum + sbu.summary.totalServicesTaken, 0);
  const totalServicesFilled = sbuResults.reduce((sum, sbu) => sum + sbu.summary.totalServicesFilled, 0);

  return {
    cycle: {
      id: cycle._id,
      name: cycle.name,
      cycleNumber: cycle.cycleNumber,
      year: cycle.year,
      status: cycle.status,
    },
    dataSource: useCurrentModels ? 'current' : 'history',
    summary: {
      totalSBUs: sbuResults.length,
      totalBrands,
      totalServicesTaken,
      totalServicesFilled,
      totalServicesUnfilled: totalServicesTaken - totalServicesFilled,
      overallFillRate: totalServicesTaken > 0
        ? Math.round((totalServicesFilled / totalServicesTaken) * 100)
        : 0,
    },
    sbus: sbuResults,
  };
};

/**
 * Helper: Map department code to display name
 */
const getDepartmentDisplayName = (code) => {
  const mapping = {
    'solutions': 'Brand Solutions',
    'media': 'Media',
    'tech': 'Tech',
    'seo': 'SEO',
    'martech': 'MarTech',
    'fluence': 'Fluence',
    'smp': 'SMP',
  };
  return mapping[code] || code;
};

export default {
  getFilterOptions,
  getResponsesByDepartment,
  getDepartmentSummary,
  getResponsesByBrand,
  getResponsesByCycle,
  getResponsesByYear,
  getResponsesBySBU,
  getStatistics,
  getDepartmentAggregation,
  getBrandAggregation,
  getSBUAggregation,
  getCycleComparison,
  getResponseById,
  getBrandsFilled,
  getRecentResponses,
  globalSearch,
  globalSearchEntities,
  getDepartmentRecords,
  getSBUDetail,
  getBIExport,
  getSBUBrandsCoverage,
};
