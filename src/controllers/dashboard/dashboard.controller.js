/**
 * Dashboard Controller
 * Handles HTTP requests for CSAT dashboard endpoints
 * Business logic delegated to dashboard.service.js
 *
 * CSV EXPORT: Add ?export=csv to any filter endpoint to download data as CSV
 * When exporting, pagination is ignored and all matching data is returned
 */

import * as DashboardService from '../../services/dashboard/dashboard.service.js';
import {
  isExportCsv,
  sendCsvResponse,
  sendAggregateCsvResponse,
  sendBIExportCsvResponse,
  generateFilename,
} from '../../utils/csv.util.js';

const getAccessContext = req => {
  const rawSbuIds = Array.isArray(req.authz?.allowedResourceIds?.sbu)
    ? req.authz.allowedResourceIds.sbu
    : [];

  const rawDepartmentIds = Array.isArray(req.authz?.allowedResourceIds?.department)
    ? req.authz.allowedResourceIds.department
    : [];

  const role = req.authz?.role || null;
  const roleScopedSbuIds = role === 'sbu' ? rawSbuIds : [];
  const roleScopedDepartmentIds =
    role === 'head_department' ? rawDepartmentIds : [];

  return {
    role,
    sbuId: roleScopedSbuIds[0] || null,
    sbuIds: roleScopedSbuIds,
    departmentId: roleScopedDepartmentIds[0] || null,
    departmentIds: roleScopedDepartmentIds,
    allSbuIds: rawSbuIds,
    allDepartmentIds: rawDepartmentIds,
  };
};

const resolveScopedSbuIds = access =>
  access.role === 'head_department' ? access.allSbuIds : access.sbuIds;

/**
 * Get all filter options
 * GET /api/v1/dashboard/filters
 */
export const getFilters = async (req, res) => {
  try {
    const access = getAccessContext(req);
    const scopedSbuIds = resolveScopedSbuIds(access);

    const data = await DashboardService.getFilterOptions({
      sbuIds: scopedSbuIds,
      departmentIds: access.departmentIds,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch filter options',
      message: error.message,
    });
  }
};

/**
 * Get responses filtered by department
 * GET /api/v1/dashboard/filter/department/:departmentId
 * Add ?export=csv to download as CSV file
 * Add ?classification=good|average|critical to filter by CSAT classification
 */
export const filterByDepartment = async (req, res) => {
  try {
    const access = getAccessContext(req);
    const scopedSbuIds = resolveScopedSbuIds(access);

    const { departmentId } = req.params;
    const { page, limit, cycleId, year, classification } = req.query;
    const exportCsv = isExportCsv(req);

    const data = await DashboardService.getResponsesByDepartment(departmentId, {
      page: exportCsv ? 1 : page,
      limit: exportCsv ? 0 : limit, // 0 = no limit for export
      cycleId,
      year,
      classification,
      sbuIds: scopedSbuIds,
    });

    // CSV Export
    if (exportCsv) {
      const responses = data.responses || data;
      return sendCsvResponse(
        res,
        responses,
        generateFilename('department', departmentId)
      );
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error filtering by department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to filter by department',
      message: error.message,
    });
  }
};

/**
 * Get department summary with all SBUs and their aggregated metrics
 * GET /api/v1/dashboard/department/summary
 * 
 * Required Query Parameters:
 * - departmentId: Department ObjectId (mandatory)
 * - cycleId: Cycle ObjectId (mandatory)
 * 
 * Optional Query Parameters:
 * - classification: good | average | critical (filters responses BEFORE aggregation)
 * 
 * CSAT Classification:
 * - Good → CSAT ≥ 3.75
 * - Average → CSAT ≥ 3.0 and < 3.75
 * - Critical → CSAT < 3.0
 */
export const getDepartmentSummary = async (req, res) => {
  try {
    const access = getAccessContext(req);
    const scopedSbuIds = resolveScopedSbuIds(access);

    const { departmentId, cycleId, classification } = req.query;

    // Validate required parameters
    if (!departmentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: departmentId',
      });
    }

    if (!cycleId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: cycleId',
      });
    }

    const data = await DashboardService.getDepartmentSummary(
      departmentId,
      cycleId,
      { classification, sbuIds: scopedSbuIds }
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching department summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch department summary',
      message: error.message,
    });
  }
};

/**
 * Get responses filtered by brand
 * GET /api/v1/dashboard/filter/brand/:brandId
 * Add ?export=csv to download as CSV file
 */
export const filterByBrand = async (req, res) => {
  try {
    const access = getAccessContext(req);
    const scopedSbuIds = resolveScopedSbuIds(access);

    const { brandId } = req.params;
    const { page, limit, departmentId, cycleId, year } = req.query;
    const exportCsv = isExportCsv(req);

    const data = await DashboardService.getResponsesByBrand(brandId, {
      page: exportCsv ? 1 : page,
      limit: exportCsv ? 0 : limit,
      departmentId,
      cycleId,
      year,
      sbuIds: scopedSbuIds,
    });

    // CSV Export
    if (exportCsv) {
      const responses = data.responses || data;
      return sendCsvResponse(
        res,
        responses,
        generateFilename('brand', brandId)
      );
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error filtering by brand:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to filter by brand',
      message: error.message,
    });
  }
};

/**
 * Get responses filtered by cycle
 * GET /api/v1/dashboard/filter/cycle/:cycleId
 * Add ?export=csv to download as CSV file
 */
export const filterByCycle = async (req, res) => {
  try {
    const access = getAccessContext(req);
    const scopedSbuIds = resolveScopedSbuIds(access);

    const { cycleId } = req.params;
    const { page, limit, departmentId, brandId } = req.query;
    const exportCsv = isExportCsv(req);

    const data = await DashboardService.getResponsesByCycle(cycleId, {
      page: exportCsv ? 1 : page,
      limit: exportCsv ? 0 : limit,
      departmentId,
      brandId,
      sbuIds: scopedSbuIds,
    });

    // CSV Export
    if (exportCsv) {
      const responses = data.responses || data;
      return sendCsvResponse(
        res,
        responses,
        generateFilename('cycle', cycleId)
      );
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error filtering by cycle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to filter by cycle',
      message: error.message,
    });
  }
};

/**
 * Get responses filtered by year
 * GET /api/v1/dashboard/filter/year/:year
 * Add ?export=csv to download as CSV file
 */
export const filterByYear = async (req, res) => {
  try {
    const access = getAccessContext(req);
    const scopedSbuIds = resolveScopedSbuIds(access);

    const { year } = req.params;
    const exportCsv = isExportCsv(req);

    const data = await DashboardService.getResponsesByYear(year, {
      sbuIds: scopedSbuIds,
    });

    // CSV Export
    if (exportCsv) {
      const responses = data.responses || data;
      return sendCsvResponse(res, responses, generateFilename('year', year));
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error filtering by year:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to filter by year',
      message: error.message,
    });
  }
};

/**
 * Get responses filtered by SBU
 * GET /api/v1/dashboard/filter/sbu/:sbuId
 * Add ?export=csv to download as CSV file
 */
export const filterBySBU = async (req, res) => {
  try {
    const { sbuId } = req.params;
    const { page, limit, cycleId, year } = req.query;
    const exportCsv = isExportCsv(req);

    const data = await DashboardService.getResponsesBySBU(sbuId, {
      page: exportCsv ? 1 : page,
      limit: exportCsv ? 0 : limit,
      cycleId,
      year,
    });

    // CSV Export
    if (exportCsv) {
      const responses = data.responses || data;
      return sendCsvResponse(res, responses, generateFilename('sbu', sbuId));
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error filtering by SBU:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to filter by SBU',
      message: error.message,
    });
  }
};

/**
 * Get dashboard statistics
 * GET /api/v1/dashboard/stats
 */
export const getStats = async (req, res) => {
  try {
    const access = getAccessContext(req);
    const scopedSbuIds = resolveScopedSbuIds(access);

    const { departmentId, brandId, cycleId, sbuId, year } = req.query;
    const isHeadDepartment = access.role === 'head_department';
    const hasDepartmentQuery = Boolean(departmentId);

    if (
      isHeadDepartment &&
      hasDepartmentQuery &&
      !access.departmentIds.includes(String(departmentId))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have access to this resource.',
      });
    }

    const scopedDepartmentIds =
      isHeadDepartment && !hasDepartmentQuery ? access.departmentIds : [];

    if (sbuId && scopedSbuIds.length > 0 && !scopedSbuIds.includes(String(sbuId))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have access to this resource.',
      });
    }

    const data = await DashboardService.getStatistics({
      departmentId,
      departmentIds: scopedDepartmentIds,
      brandId,
      cycleId,
      sbuId: sbuId || undefined,
      sbuIds: sbuId ? [] : scopedSbuIds,
      year,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message,
    });
  }
};

/**
 * Get department aggregation
 * GET /api/v1/dashboard/aggregate/departments
 * Add ?export=csv to download as CSV file
 */
export const aggregateByDepartment = async (req, res) => {
  try {
    const access = getAccessContext(req);
    const scopedSbuIds = resolveScopedSbuIds(access);

    const { cycleId, year } = req.query;
    const exportCsv = isExportCsv(req);

    const data = await DashboardService.getDepartmentAggregation({
      cycleId,
      year,
      sbuIds: scopedSbuIds,
    });

    // CSV Export
    if (exportCsv) {
      // Map field names to readable column headers
      const headerMap = {
        departmentName: 'Department',
        departmentId: 'Department ID',
        totalResponses: 'Total Responses',
        avgSatisfaction: 'Avg CSAT Score',
        avgNPS: 'Avg NPS Score',
        brandCount: 'Number of Brands',
      };

      return sendAggregateCsvResponse(
        res,
        data,
        generateFilename('departments_aggregate', year || 'all'),
        { headerMap }
      );
    }

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('Error aggregating departments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to aggregate departments',
      message: error.message,
    });
  }
};

/**
 * Get brand aggregation
 * GET /api/v1/dashboard/aggregate/brands
 */
export const aggregateByBrand = async (req, res) => {
  try {
    const access = getAccessContext(req);
    const scopedSbuIds = resolveScopedSbuIds(access);

    const { departmentId, cycleId, year, limit } = req.query;

    const data = await DashboardService.getBrandAggregation({
      departmentId,
      cycleId,
      year,
      limit,
      sbuIds: scopedSbuIds,
    });

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('Error aggregating brands:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to aggregate brands',
      message: error.message,
    });
  }
};

/**
 * Get SBU aggregation
 * GET /api/v1/dashboard/aggregate/sbus
 */
export const aggregateBySBU = async (req, res) => {
  try {
    const access = getAccessContext(req);
    const scopedSbuIds = resolveScopedSbuIds(access);

    const { cycleId, year } = req.query;

    const data = await DashboardService.getSBUAggregation({
      cycleId,
      year,
      sbuIds: scopedSbuIds,
    });

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('Error aggregating SBUs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to aggregate SBUs',
      message: error.message,
    });
  }
};

/**
 * Get cycle comparison
 * GET /api/v1/dashboard/aggregate/cycles
 */
export const aggregateByCycle = async (req, res) => {
  try {
    const access = getAccessContext(req);
    const scopedSbuIds = resolveScopedSbuIds(access);

    const { departmentId, year } = req.query;

    const data = await DashboardService.getCycleComparison({
      departmentId,
      year,
      sbuIds: scopedSbuIds,
    });

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('Error comparing cycles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare cycles',
      message: error.message,
    });
  }
};

/**
 * Get single response by ID
 * GET /api/v1/dashboard/response/:id
 */
export const getResponse = async (req, res) => {
  try {
    const access = getAccessContext(req);

    const { id } = req.params;
    const scopedSbuIds = resolveScopedSbuIds(access);

    const data = await DashboardService.getResponseById(id, {
      sbuIds: scopedSbuIds,
      departmentIds: access.departmentIds,
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Response not found',
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch response',
      message: error.message,
    });
  }
};

/**
 * Get brands filled/unfilled for coverage tracking
 * GET /api/v1/dashboard/brands-filled
 * Add ?export=csv to download as CSV file
 */
export const getBrandsFilled = async (req, res) => {
  try {
    const access = getAccessContext(req);
    const scopedSbuIds = resolveScopedSbuIds(access);

    const { cycleId, year, departmentId, filled, groupBy } = req.query;
    const exportCsv = isExportCsv(req);

    const data = await DashboardService.getBrandsFilled({
      cycleId,
      year,
      departmentId,
      departmentIds: access.departmentIds,
      filled: filled !== 'false', // Default to true
      groupBy: groupBy || 'sbu',
      sbuIds: scopedSbuIds,
    });

    // CSV Export
    if (exportCsv) {
      const filledStatus = filled !== 'false' ? 'filled' : 'unfilled';
      const brands = data.brands || data;
      return sendCsvResponse(
        res,
        brands,
        generateFilename(`brands_${filledStatus}`, departmentId || 'all')
      );
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching brands filled:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brands filled',
      message: error.message,
    });
  }
};

/**
 * Get recent CSAT responses
 * GET /api/v1/dashboard/recent
 */
export const getRecentResponses = async (req, res) => {
  try {
    const access = getAccessContext(req);
    const scopedSbuIds = resolveScopedSbuIds(access);

    const { departmentId, search, startDate, endDate, page, limit } = req.query;

    const data = await DashboardService.getRecentResponses({
      departmentId,
      departmentIds: access.departmentIds,
      search,
      startDate,
      endDate,
      page,
      limit,
      sbuIds: scopedSbuIds,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching recent responses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent responses',
      message: error.message,
    });
  }
};

/**
 * Global search across all historical CSAT data
 * GET /api/v1/dashboard/search
 */
export const searchGlobal = async (req, res) => {
  try {
    const access = getAccessContext(req);
    const scopedSbuIds = resolveScopedSbuIds(access);

    const { q, limit } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search term must be at least 2 characters',
      });
    }

    const data = await DashboardService.globalSearch(q, {
      limit,
      sbuIds: scopedSbuIds,
      departmentIds: access.departmentIds,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error performing global search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform search',
      message: error.message,
    });
  }
};

/**
 * Global search across all entities - SBUs, Brands, Clients, and CSAT Responses
 * GET /api/v1/dashboard/global-search
 * 
 * Returns results in ordered priority:
 * 1) SBUs
 * 2) Brands
 * 3) Clients
 * 4) CSAT Responses
 */
export const globalSearchEntities = async (req, res) => {
  try {
    const access = getAccessContext(req);
    const scopedSbuIds = resolveScopedSbuIds(access);

    const { q, limit, cycleId, departmentId } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search term must be at least 2 characters',
      });
    }

    if (
      access.role === 'head_department' &&
      departmentId &&
      !access.departmentIds.includes(String(departmentId))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have access to this resource.',
      });
    }

    const data = await DashboardService.globalSearchEntities(q, {
      limit,
      cycleId,
      departmentId,
      sbuIds: scopedSbuIds,
      departmentIds: access.departmentIds,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error performing global entity search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform global search',
      message: error.message,
    });
  }
};

/**
 * Get department records table with POC details
 * GET /api/v1/dashboard/department/:departmentId/records
 */
export const getDepartmentRecords = async (req, res) => {
  try {
    const access = getAccessContext(req);
    const scopedSbuIds = resolveScopedSbuIds(access);

    const { departmentId } = req.params;
    const { cycleId, year, search, page, limit } = req.query;

    const data = await DashboardService.getDepartmentRecords(departmentId, {
      cycleId,
      year,
      search,
      page,
      limit,
      sbuIds: scopedSbuIds,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching department records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch department records',
      message: error.message,
    });
  }
};

/**
 * Get SBU detail page with individual responses
 * GET /api/v1/dashboard/sbu/:sbuId/detail
 */
export const getSBUDetail = async (req, res) => {
  try {
    const { sbuId } = req.params;
    const {
      cycleId,
      year,
      search,
      startDate,
      endDate,
      departmentId,
      page,
      limit,
    } = req.query;

    const data = await DashboardService.getSBUDetail(sbuId, {
      cycleId,
      year,
      search,
      startDate,
      endDate,
      departmentId,
      page,
      limit,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching SBU detail:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch SBU detail',
      message: error.message,
    });
  }
};

/**
 * Get BI Export data
 * GET /api/v1/dashboard/bi-export
 * Add ?export=csv to download as CSV file
 */
export const getBIExport = async (req, res) => {
  try {
    const access = getAccessContext(req);
    const scopedSbuIds = resolveScopedSbuIds(access);

    const { cycleId, departmentId } = req.query;
    const exportCsv = isExportCsv(req);

    // Validate required parameters
    if (!cycleId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: cycleId',
      });
    }

    if (
      access.role === 'head_department' &&
      departmentId &&
      !access.departmentIds.includes(String(departmentId))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have access to this resource.',
      });
    }

    const data = await DashboardService.getBIExport({
      cycleId,
      departmentId: departmentId || null,
      departmentIds: access.departmentIds,
      sbuIds: scopedSbuIds,
    });

    // CSV Export with department grouping
    if (exportCsv) {
      const responses = data.responses || [];
      return sendBIExportCsvResponse(
        res,
        responses,
        generateFilename('bi_export', `cycle_${data.cycle.cycleNumber}_${data.cycle.year}`)
      );
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching BI export:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch BI export',
      message: error.message,
    });
  }
};

/**
 * Get SBU brands coverage report
 * GET /api/v1/dashboard/sbu-brands-coverage
 */
export const getSBUBrandsCoverage = async (req, res) => {
  try {
    const access = getAccessContext(req);
    const scopedSbuIds = resolveScopedSbuIds(access);

    const { cycleId } = req.query;

    // Validate required parameters
    if (!cycleId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: cycleId',
      });
    }

    const data = await DashboardService.getSBUBrandsCoverage({
      cycleId,
      departmentIds: access.departmentIds,
      sbuIds: scopedSbuIds,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching SBU brands coverage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch SBU brands coverage',
      message: error.message,
    });
  }
};

export default {
  getFilters,
  filterByDepartment,
  getDepartmentSummary,
  filterByBrand,
  filterByCycle,
  filterByYear,
  filterBySBU,
  getStats,
  aggregateByDepartment,
  aggregateByBrand,
  aggregateBySBU,
  aggregateByCycle,
  getResponse,
  getBrandsFilled,
  getRecentResponses,
  searchGlobal,
  globalSearchEntities,
  getDepartmentRecords,
  getSBUDetail,
  getBIExport,
  getSBUBrandsCoverage,
};
