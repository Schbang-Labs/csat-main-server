/**
 * Dashboard Service
 * Business logic for CSAT dashboard data retrieval and aggregation
 */

import mongoose from 'mongoose';
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
  calculateResponseScores,
  CSAT_CLASSIFICATION,
  getCSATClassification,
  isValidClassification,
  RESPONSE_POPULATIONS,
  RESPONSE_POPULATIONS_DETAILED,
} from './helper.js';

/**
 * Get all available filter options
 * @returns {Promise<Object>} Filter options
 */
export const getFilterOptions = async () => {
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
  const { page, limit, cycleId, year, classification } = options;
  const pagination = calculatePagination(page, limit);

  const filter = await buildFilterWithYear({ cycleId, year });
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
      .sort({ submittedAt: -1 })
      .lean(),
    Department.findById(departmentId).select('name displayName').lean(),
    // Calculate fill rates for this department
    calculateFillRates({ departmentId, cycleId, year }),
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
  const { classification } = options;
  const needsClassificationFilter = classification && isValidClassification(classification);

  // Get department info
  const department = await Department.findById(departmentId).select('name displayName').lean();

  if (!department) {
    throw new Error('Department not found');
  }

  // Try to get SBU data from SBUHistory for this specific cycle
  const sbuHistories = await SBUHistory.find({
    departmentId: toObjectId(departmentId),
    cycleId: toObjectId(cycleId),
  })
    .populate('sbuId', 'name slug isActive')
    .select('sbuId executiveVP associateVP associateVPs creativeDirector leadNames')
    .lean();

  // Filter out inactive SBUs and map to a usable format
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

  // If no history found for this cycle, fall back to current SBU data
  let departmentSBUs;
  if (sbuHistoriesMap.size === 0) {
    departmentSBUs = await SBU.find({ departmentId: toObjectId(departmentId), isActive: true })
      .select('name slug executiveVP associateVP associateVPs creativeDirector leadNames')
      .sort({ name: 1 })
      .lean();
  } else {
    // Use SBU history data
    departmentSBUs = Array.from(sbuHistoriesMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }

  // Build base filter for responses
  const filter = {
    isValid: true,
    departmentId: toObjectId(departmentId),
    cycleId: toObjectId(cycleId),
  };

  // Fetch all responses for this department and cycle
  const allResponsesRaw = await CSATResponse.find(filter)
    .select('sbuId data')
    .lean();

  // Enrich with CSAT scores for classification filtering
  let allResponses = allResponsesRaw.map(response => {
    const { csatScore, npsScore } = calculateResponseScores(response.data);
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
    console.log("sbuResponses.length", sbuResponses.length);
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
    departmentId: departmentId,
    departmentName: department.displayName || department.name,
    cycleId: cycleId,
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
  const { page, limit, departmentId, cycleId, year } = options;
  const pagination = calculatePagination(page, limit);

  const filter = await buildFilterWithYear({ departmentId, cycleId, year });
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
  const { page, limit, departmentId, brandId } = options;
  const pagination = calculatePagination(page, limit);

  const filter = await buildFilterWithYear({ departmentId, brandId, cycleId });

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
 * @returns {Promise<Object>} Cycles for the year
 */
export const getResponsesByYear = async year => {
  const cycles = await Cycle.find({ year: parseInt(year) })
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

  const [stats, scoreDistribution] = await Promise.all([
    CSATResponse.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalResponses: { $sum: 1 },
          avgOverallSatisfaction: {
            $avg: '$data.coreMetrics.overallSatisfaction',
          },
          avgLikelihoodToRecommend: {
            $avg: '$data.coreMetrics.likelihoodToRecommend',
          },
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
      {
        $group: {
          _id: '$data.coreMetrics.overallSatisfaction',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]),
  ]);

  const totalResponses = stats[0]?.totalResponses || 0;

  return {
    summary: stats[0] || {
      totalResponses: 0,
      avgOverallSatisfaction: 0,
      avgLikelihoodToRecommend: 0,
      brandCount: 0,
      pocCount: 0,
      departmentCount: 0,
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
    {
      $group: {
        _id: '$departmentId',
        totalResponses: { $sum: 1 },
        avgSatisfaction: { $avg: '$data.coreMetrics.overallSatisfaction' },
        avgNPS: { $avg: '$data.coreMetrics.likelihoodToRecommend' },
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
    {
      $group: {
        _id: '$brandId',
        totalResponses: { $sum: 1 },
        avgSatisfaction: { $avg: '$data.coreMetrics.overallSatisfaction' },
        avgNPS: { $avg: '$data.coreMetrics.likelihoodToRecommend' },
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
  filter.sbuId = { $ne: null };

  return CSATResponse.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$sbuId',
        totalResponses: { $sum: 1 },
        avgSatisfaction: { $avg: '$data.coreMetrics.overallSatisfaction' },
        avgNPS: { $avg: '$data.coreMetrics.likelihoodToRecommend' },
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
    {
      $group: {
        _id: '$cycleId',
        totalResponses: { $sum: 1 },
        avgSatisfaction: { $avg: '$data.coreMetrics.overallSatisfaction' },
        avgNPS: { $avg: '$data.coreMetrics.likelihoodToRecommend' },
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
export const getResponseById = async responseId => {
  const response = await CSATResponse.findById(responseId)
    .populate(RESPONSE_POPULATIONS_DETAILED.brand)
    .populate(RESPONSE_POPULATIONS_DETAILED.client)
    .populate(RESPONSE_POPULATIONS_DETAILED.department)
    .populate(RESPONSE_POPULATIONS_DETAILED.cycle)
    .populate(RESPONSE_POPULATIONS_DETAILED.sbu)
    .lean();

  if (!response) return null;

  // If history IDs exist, populate from history models for accurate historical data
  if (response.sbuHistoryId) {
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

  if (response.brandHistoryId) {
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

  if (response.clientHistoryId) {
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
    filled = true,
    groupBy = 'sbu',
  } = params;

  // Get department info if departmentId provided
  let departmentCode = null;
  if (departmentId) {
    const dept = await Department.findById(departmentId).select('name').lean();
    departmentCode = dept?.name || null;
  }

  // Get filter for cycle/year/department
  const responseFilter = await buildFilterWithYear({
    cycleId,
    year,
    departmentId,
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

  // Build brand query based on department filter
  const brandQuery = { isActive: true };
  if (departmentCode) {
    // Filter brands that have this department in their services
    brandQuery['services.department'] = departmentCode;
  }

  // Get brands based on filled/unfilled toggle
  if (filled) {
    brandQuery._id = { $in: filledBrandIds };
  } else {
    // For unfilled, get all brands for the department first
    if (departmentCode) {
      const allBrandsForDept = await Brand.find({
        isActive: true,
        'services.department': departmentCode,
      })
        .select('_id')
        .lean();
      const allBrandIdsForDept = allBrandsForDept.map(b => b._id);
      // Unfilled = brands for department that are NOT in filledBrandIds
      brandQuery._id = {
        $in: allBrandIdsForDept.filter(
          id => !filledBrandIds.some(fid => fid.toString() === id.toString())
        ),
      };
    } else {
      brandQuery._id = { $nin: filledBrandIds };
    }
  }

  const brands = await Brand.find(brandQuery)
    .populate('services.sbuId', 'name executiveVP associateVP creativeDirector')
    .select('name slug services')
    .lean();

  // Get total POCs (clients) count per brand for the specific department
  const brandIds = brands.map(b => b._id);
  const clientQuery = { brandId: { $in: brandIds }, isActive: true };
  if (departmentCode) {
    clientQuery['serviceMapping.department'] = departmentCode;
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
    const solutionsService = brand.services?.find(
      s => s.department === 'solutions'
    );
    const sbu = solutionsService?.sbuId;
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
  if (departmentCode) {
    totalBrandsQuery['services.department'] = departmentCode;
    totalPOCsQuery['serviceMapping.department'] = departmentCode;
  }

  const [totalMappedBrands, totalPOCs] = await Promise.all([
    Brand.countDocuments(totalBrandsQuery),
    Client.countDocuments(totalPOCsQuery),
  ]);

  return {
    filled,
    departmentFilter: departmentCode || 'all',
    // Summary metrics
    totalMappedBrands,
    totalBrandsFilled: filledBrandIds.length,
    totalBrandsUnfilled: Math.max(0, totalMappedBrands - filledBrandIds.length),
    totalPOCs,
    totalPOCsFilled,
    totalPOCsUnfilled: Math.max(0, totalPOCs - totalPOCsFilled),
    brandFillRate:
      totalMappedBrands > 0
        ? Math.round((filledBrandIds.length / totalMappedBrands) * 100 * 100) /
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
    search,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = params;
  const pagination = calculatePagination(page, limit);

  const filter = { isValid: true };

  if (departmentId) {
    filter.departmentId = toObjectId(departmentId);
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
  const { limit = 100 } = options;

  if (!searchTerm || searchTerm.trim().length < 2) {
    return { results: [], total: 0, groupedByCycle: [] };
  }

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
      score: resp.data?.coreMetrics?.overallSatisfaction,
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
 * Get department records table (POC details)
 * @param {string} departmentId - Department ObjectId
 * @param {Object} params - Filter parameters (cycleId, year, search, page, limit)
 * @returns {Promise<Object>} Department records with POC details
 */
export const getDepartmentRecords = async (departmentId, params = {}) => {
  const { cycleId, year, search, page = 1, limit = 50 } = params;
  const pagination = calculatePagination(page, limit);

  const filter = await buildFilterWithYear({ departmentId, cycleId, year });

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
    score: resp.data?.coreMetrics?.overallSatisfaction,
    nps: resp.data?.coreMetrics?.likelihoodToRecommend,
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
      {
        $group: {
          _id: null,
          avgCsat: { $avg: '$data.coreMetrics.overallSatisfaction' },
          avgNps: { $avg: '$data.coreMetrics.likelihoodToRecommend' },
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
    csatScore: resp.data?.coreMetrics?.overallSatisfaction,
    npsScore: resp.data?.coreMetrics?.likelihoodToRecommend,
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
export const getBIExport = async (cycleId, departmentId = null) => {
  // Get cycle info
  const cycle = await Cycle.findById(cycleId)
    .select('name cycleNumber year')
    .lean();

  if (!cycle) {
    throw new Error('Cycle not found');
  }

  // Build filter for responses
  const responseFilter = {
    cycleId: toObjectId(cycleId),
    isValid: true,
  };

  // If departmentId provided, filter by it
  if (departmentId) {
    responseFilter.departmentId = toObjectId(departmentId);
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
  const departmentIds = [...new Set(enrichedResponses.map(r => r.departmentId?._id?.toString()).filter(Boolean))];

  // Fetch SBU histories for all departments in this cycle
  const sbuHistoriesMap = new Map();
  
  if (departmentIds.length > 0) {
    const sbuHistories = await SBUHistory.find({
      departmentId: { $in: departmentIds.map(id => toObjectId(id)) },
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
  const finalResponses = enrichedResponses.map((response) => {
    if (response.sbuId && response.sbuId._id) {
      const sbuIdStr = response.sbuId._id.toString();
      const sbuHistory = sbuHistoriesMap.get(sbuIdStr);

      if (sbuHistory) {
        // Merge historical leadership data
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
  const departments = await Department.find(
    departmentId ? { _id: toObjectId(departmentId) } : {}
  )
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
 */
export const getSBUBrandsCoverage = async (cycleId) => {
  // Get cycle info
  const cycle = await Cycle.findById(cycleId)
    .select('name cycleNumber year')
    .lean();

  if (!cycle) {
    throw new Error('Cycle not found');
  }

  // Get all SBU histories for this cycle
  const sbuHistories = await SBUHistory.find({
    cycleId: toObjectId(cycleId),
  })
    .populate('sbuId', 'name slug')
    .populate('departmentId', 'name displayName')
    .select('sbuId departmentId brands executiveVP associateVP associateVPs creativeDirector leadNames')
    .lean();

  if (sbuHistories.length === 0) {
    return {
      cycle: {
        id: cycle._id,
        name: cycle.name,
        cycleNumber: cycle.cycleNumber,
        year: cycle.year,
      },
      sbus: [],
      totalSBUs: 0,
      totalBrands: 0,
    };
  }

  // Process each SBU
  const sbuResults = [];

  for (const sbuHistory of sbuHistories) {
    if (!sbuHistory.sbuId) continue;

    const sbuId = sbuHistory.sbuId._id;
    const sbuName = sbuHistory.sbuId.name;
    const departmentName = sbuHistory.departmentId?.displayName || sbuHistory.departmentId?.name;

    // sbuHistory.brands contains Brand ObjectIds (not BrandHistory ObjectIds)
    // Query BrandHistory where brandId is in sbuHistory.brands array
    const brandHistories = await BrandHistory.find({
      cycleId: toObjectId(cycleId),
      brandId: { $in: sbuHistory.brands || [] },
    })
      .populate('brandId', 'name slug')
      .select('brandId name services')
      .lean();

    // For each brand, check which departments have filled CSAT
    const brandsData = [];

    for (const brandHistory of brandHistories) {
      if (!brandHistory.brandId) continue;

      const brandId = brandHistory.brandId._id;
      const brandName = brandHistory.name || brandHistory.brandId.name;

      // Get all services this brand has taken (from all departments)
      const services = brandHistory.services || [];
      
      // Extract unique departments from services
      const departmentsTaken = [...new Set(services.map(s => s.department).filter(Boolean))];

      // Check which departments have filled CSAT for this brand in this cycle
      const csatResponses = await CSATResponse.find({
        brandId: toObjectId(brandId),
        cycleId: toObjectId(cycleId),
        isValid: true,
      })
        .populate('departmentId', 'name displayName')
        .select('departmentId')
        .lean();

      // Get unique departments that filled CSAT
      const departmentsFilled = [...new Set(
        csatResponses
          .map(r => r.departmentId?.displayName || r.departmentId?.name)
          .filter(Boolean)
      )];

      // Map services to show which are filled
      const servicesDetail = departmentsTaken.map(deptCode => {
        // Find the service entry
        const serviceEntry = services.find(s => s.department === deptCode);
        
        // Map department code to display name
        const deptDisplayName = getDepartmentDisplayName(deptCode);
        
        // Check if this department filled CSAT
        const isFilled = departmentsFilled.some(d => 
          d.toLowerCase().includes(deptDisplayName.toLowerCase()) ||
          deptDisplayName.toLowerCase().includes(d.toLowerCase())
        );

        return {
          department: deptDisplayName,
          departmentCode: deptCode,
          isActive: serviceEntry?.isActive || false,
          isFilled: isFilled,
          startDate: serviceEntry?.startDate,
          endDate: serviceEntry?.endDate,
        };
      });

      brandsData.push({
        brandId: brandId,
        brandName: brandName,
        slug: brandHistory.brandId.slug,
        totalServices: servicesDetail.length,
        servicesFilled: servicesDetail.filter(s => s.isFilled).length,
        servicesUnfilled: servicesDetail.filter(s => !s.isFilled).length,
        services: servicesDetail,
        departmentsFilled: departmentsFilled,
      });
    }

    // Calculate SBU totals
    const totalBrands = brandsData.length;
    const totalServicesTaken = brandsData.reduce((sum, b) => sum + b.totalServices, 0);
    const totalServicesFilled = brandsData.reduce((sum, b) => sum + b.servicesFilled, 0);
    const totalServicesUnfilled = brandsData.reduce((sum, b) => sum + b.servicesUnfilled, 0);

    sbuResults.push({
      sbuId: sbuId,
      sbuName: sbuName,
      sbuSlug: sbuHistory.sbuId.slug,
      department: departmentName,
      leadership: {
        executiveVP: sbuHistory.executiveVP,
        associateVP: sbuHistory.associateVP,
        associateVPs: sbuHistory.associateVPs || [],
        creativeDirector: sbuHistory.creativeDirector,
        leadNames: sbuHistory.leadNames || [],
      },
      summary: {
        totalBrands: totalBrands,
        totalServicesTaken: totalServicesTaken,
        totalServicesFilled: totalServicesFilled,
        totalServicesUnfilled: totalServicesUnfilled,
        fillRate: totalServicesTaken > 0 
          ? Math.round((totalServicesFilled / totalServicesTaken) * 100) 
          : 0,
      },
      brands: brandsData.sort((a, b) => a.brandName.localeCompare(b.brandName)),
    });
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
    },
    summary: {
      totalSBUs: sbuResults.length,
      totalBrands: totalBrands,
      totalServicesTaken: totalServicesTaken,
      totalServicesFilled: totalServicesFilled,
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
  getDepartmentRecords,
  getSBUDetail,
  getBIExport,
  getSBUBrandsCoverage,
};
