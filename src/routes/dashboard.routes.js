/**
 * Dashboard Routes
 * RESTful API endpoints for CSAT dashboard with filtering
 *
 * @swagger
 * /api/v1/dashboard:
 *   get:
 *     summary: Dashboard API root
 *     description: Returns basic API information and available endpoints
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API information retrieved successfully
 */

import { Router } from 'express';
import {
  getFilters,
  filterByDepartment,
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
  getDepartmentRecords,
  getSBUDetail,
} from '../controllers/dashboard/dashboard.controller.js';

const router = Router();

// ============================================
// Filter Options
// ============================================

/**
 * @swagger
 * /api/v1/dashboard/filters:
 *   get:
 *     summary: Get all available filter options
 *     description: |
 *       Returns all available options for filtering CSAT data including:
 *       - All active departments
 *       - All active brands
 *       - All cycles (sorted by year and cycle number descending)
 *       - All active SBUs with department info
 *       - All available years
 *     tags: [Dashboard - Filters]
 *     responses:
 *       200:
 *         description: Filter options retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/FilterOptionsResponse'
 *             example:
 *               success: true
 *               data:
 *                 departments:
 *                   - _id: "507f1f77bcf86cd799439011"
 *                     name: "solutions"
 *                     displayName: "Solutions"
 *                     hasSBUs: true
 *                 brands:
 *                   - _id: "507f1f77bcf86cd799439012"
 *                     name: "Tata Motors"
 *                     slug: "tata-motors"
 *                 cycles:
 *                   - _id: "507f1f77bcf86cd799439013"
 *                     name: "Cycle 5 - 2025"
 *                     cycleNumber: 5
 *                     year: 2025
 *                     status: "active"
 *                 sbus:
 *                   - _id: "507f1f77bcf86cd799439014"
 *                     name: "POD Phoenix"
 *                     slug: "pod-phoenix"
 *                 years: [2025, 2024, 2023]
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/filters', getFilters);

// ============================================
// Coverage & Drill-down
// ============================================

/**
 * @swagger
 * /api/v1/dashboard/brands-filled:
 *   get:
 *     summary: Get brands filled/unfilled for coverage tracking
 *     description: |
 *       Returns brand coverage statistics showing which brands have submitted CSAT responses.
 *
 *       **Key Metrics:**
 *       - Total mapped brands vs filled brands
 *       - Total POCs vs filled POCs
 *       - Brand and POC fill rates as percentages
 *
 *       Results can be grouped by SBU and filtered by department.
 *     tags: [Dashboard - Coverage]
 *     parameters:
 *       - $ref: '#/components/parameters/CycleIdParam'
 *       - $ref: '#/components/parameters/YearParam'
 *       - $ref: '#/components/parameters/DepartmentIdParam'
 *       - in: query
 *         name: filled
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filter by filled (true) or unfilled (false) brands
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [sbu, department]
 *           default: sbu
 *         description: Group results by SBU or department
 *       - $ref: '#/components/parameters/ExportParam'
 *     responses:
 *       200:
 *         description: Coverage data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     filled:
 *                       type: boolean
 *                     departmentFilter:
 *                       type: string
 *                     totalMappedBrands:
 *                       type: integer
 *                     totalBrandsFilled:
 *                       type: integer
 *                     totalBrandsUnfilled:
 *                       type: integer
 *                     totalPOCs:
 *                       type: integer
 *                     totalPOCsFilled:
 *                       type: integer
 *                     totalPOCsUnfilled:
 *                       type: integer
 *                     brandFillRate:
 *                       type: number
 *                     pocFillRate:
 *                       type: number
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *       500:
 *         description: Server error
 */
router.get('/brands-filled', getBrandsFilled);

/**
 * @swagger
 * /api/v1/dashboard/recent:
 *   get:
 *     summary: Get recent CSAT responses
 *     description: |
 *       Returns the most recent CSAT responses across all departments.
 *       Supports filtering by department, search term, and date range.
 *     tags: [Dashboard - Coverage]
 *     parameters:
 *       - $ref: '#/components/parameters/DepartmentIdParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter responses from this date (ISO format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter responses until this date (ISO format)
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Recent responses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     responses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CSATResponse'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *       500:
 *         description: Server error
 */
router.get('/recent', getRecentResponses);

/**
 * @swagger
 * /api/v1/dashboard/search:
 *   get:
 *     summary: Global search across all CSAT data
 *     description: |
 *       Performs a global search across all historical CSAT data.
 *       Searches across brand names, client names, and comments.
 *
 *       **Minimum search term length:** 2 characters
 *     tags: [Dashboard - Coverage]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search term (minimum 2 characters)
 *         example: "Tata"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid search term
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Search term must be at least 2 characters"
 *       500:
 *         description: Server error
 */
router.get('/search', searchGlobal);

// ============================================
// Filter By Entity - Get Filtered Responses
// ============================================

/**
 * @swagger
 * /api/v1/dashboard/filter/department/{departmentId}:
 *   get:
 *     summary: Get CSAT responses filtered by department
 *     description: |
 *       Returns paginated CSAT responses for a specific department.
 *       Includes aggregated scores and fill rate statistics.
 *
 *       **CSV Export:** Add `?export=csv` to download all results as a CSV file.
 *       When exporting, pagination is ignored and all matching responses are returned.
 *     tags: [Dashboard - Filter By Entity]
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the department
 *         example: "507f1f77bcf86cd799439011"
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/CycleIdParam'
 *       - $ref: '#/components/parameters/YearParam'
 *       - $ref: '#/components/parameters/ExportParam'
 *     responses:
 *       200:
 *         description: Filtered responses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     department:
 *                       $ref: '#/components/schemas/Department'
 *                     aggregates:
 *                       $ref: '#/components/schemas/AggregateScores'
 *                     fillRates:
 *                       $ref: '#/components/schemas/FillRates'
 *                     responses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CSATResponse'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *             description: CSV file download when ?export=csv is used
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/filter/department/:departmentId', filterByDepartment);

/**
 * @swagger
 * /api/v1/dashboard/filter/brand/{brandId}:
 *   get:
 *     summary: Get CSAT responses filtered by brand
 *     description: |
 *       Returns paginated CSAT responses for a specific brand.
 *       Includes aggregated CSAT and NPS scores.
 *
 *       **CSV Export:** Add `?export=csv` to download all results as a CSV file.
 *     tags: [Dashboard - Filter By Entity]
 *     parameters:
 *       - in: path
 *         name: brandId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the brand
 *         example: "507f1f77bcf86cd799439011"
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/DepartmentIdParam'
 *       - $ref: '#/components/parameters/CycleIdParam'
 *       - $ref: '#/components/parameters/YearParam'
 *       - $ref: '#/components/parameters/ExportParam'
 *     responses:
 *       200:
 *         description: Filtered responses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     brand:
 *                       $ref: '#/components/schemas/Brand'
 *                     aggregates:
 *                       $ref: '#/components/schemas/AggregateScores'
 *                     responses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CSATResponse'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Server error
 */
router.get('/filter/brand/:brandId', filterByBrand);

/**
 * @swagger
 * /api/v1/dashboard/filter/cycle/{cycleId}:
 *   get:
 *     summary: Get CSAT responses filtered by cycle
 *     description: |
 *       Returns paginated CSAT responses for a specific cycle.
 *       Includes cycle information and aggregated scores.
 *
 *       For historical cycles, responses are enriched with historical
 *       brand/client/SBU data from that cycle's snapshot.
 *
 *       **CSV Export:** Add `?export=csv` to download all results as a CSV file.
 *       This exports ALL matching responses regardless of pagination.
 *     tags: [Dashboard - Filter By Entity]
 *     parameters:
 *       - in: path
 *         name: cycleId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the cycle
 *         example: "507f1f77bcf86cd799439011"
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/DepartmentIdParam'
 *       - $ref: '#/components/parameters/BrandIdParam'
 *       - $ref: '#/components/parameters/ExportParam'
 *     responses:
 *       200:
 *         description: Filtered responses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     cycle:
 *                       $ref: '#/components/schemas/Cycle'
 *                     aggregates:
 *                       $ref: '#/components/schemas/AggregateScores'
 *                     responses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CSATResponse'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Server error
 */
router.get('/filter/cycle/:cycleId', filterByCycle);

/**
 * @swagger
 * /api/v1/dashboard/filter/year/{year}:
 *   get:
 *     summary: Get cycles for a specific year
 *     description: |
 *       Returns all cycles for the specified year.
 *       This endpoint returns cycle metadata only, not individual responses.
 *
 *       Use the cycle IDs returned to fetch responses via `/filter/cycle/{cycleId}`.
 *     tags: [Dashboard - Filter By Entity]
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year to filter (e.g., 2025)
 *         example: 2025
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/DepartmentIdParam'
 *       - $ref: '#/components/parameters/BrandIdParam'
 *       - $ref: '#/components/parameters/ExportParam'
 *     responses:
 *       200:
 *         description: Year data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     year:
 *                       type: integer
 *                       example: 2025
 *                     cycles:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Cycle'
 *                     totalCycles:
 *                       type: integer
 *                       example: 5
 *       500:
 *         description: Server error
 */
router.get('/filter/year/:year', filterByYear);

/**
 * @swagger
 * /api/v1/dashboard/filter/sbu/{sbuId}:
 *   get:
 *     summary: Get CSAT responses filtered by SBU
 *     description: |
 *       Returns paginated CSAT responses for a specific SBU/POD.
 *       Includes SBU details, aggregated scores, and fill rate statistics.
 *
 *       **CSV Export:** Add `?export=csv` to download all results as a CSV file.
 *     tags: [Dashboard - Filter By Entity]
 *     parameters:
 *       - in: path
 *         name: sbuId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the SBU
 *         example: "507f1f77bcf86cd799439011"
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/CycleIdParam'
 *       - $ref: '#/components/parameters/YearParam'
 *       - $ref: '#/components/parameters/ExportParam'
 *     responses:
 *       200:
 *         description: Filtered responses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sbu:
 *                       $ref: '#/components/schemas/SBU'
 *                     aggregates:
 *                       $ref: '#/components/schemas/AggregateScores'
 *                     fillRates:
 *                       $ref: '#/components/schemas/FillRates'
 *                     responses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CSATResponse'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Server error
 */
router.get('/filter/sbu/:sbuId', filterBySBU);

// ============================================
// Statistics & Aggregations
// ============================================

/**
 * @swagger
 * /api/v1/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: |
 *       Returns aggregated statistics for the dashboard with optional filters.
 *
 *       **Summary includes:**
 *       - Total responses count
 *       - Average satisfaction and NPS scores
 *       - Unique brand, POC, and department counts
 *       - Score distribution breakdown
 *     tags: [Dashboard - Aggregations]
 *     parameters:
 *       - $ref: '#/components/parameters/DepartmentIdParam'
 *       - $ref: '#/components/parameters/BrandIdParam'
 *       - $ref: '#/components/parameters/CycleIdParam'
 *       - $ref: '#/components/parameters/SbuIdParam'
 *       - $ref: '#/components/parameters/YearParam'
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalResponses:
 *                           type: integer
 *                           example: 150
 *                         avgOverallSatisfaction:
 *                           type: number
 *                           example: 4.2
 *                         avgLikelihoodToRecommend:
 *                           type: number
 *                           example: 4.1
 *                         brandCount:
 *                           type: integer
 *                           example: 45
 *                         pocCount:
 *                           type: integer
 *                           example: 120
 *                         departmentCount:
 *                           type: integer
 *                           example: 5
 *                     scoreDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           score:
 *                             type: integer
 *                           count:
 *                             type: integer
 *                           percentage:
 *                             type: number
 *       500:
 *         description: Server error
 */
router.get('/stats', getStats);

/**
 * @swagger
 * /api/v1/dashboard/aggregate/departments:
 *   get:
 *     summary: Get department-wise aggregated statistics
 *     description: |
 *       Returns aggregated CSAT statistics grouped by department.
 *       Useful for comparing performance across departments.
 *     tags: [Dashboard - Aggregations]
 *     parameters:
 *       - $ref: '#/components/parameters/CycleIdParam'
 *       - $ref: '#/components/parameters/YearParam'
 *     responses:
 *       200:
 *         description: Department aggregation retrieved successfully
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
 *                     $ref: '#/components/schemas/DepartmentAggregation'
 *       500:
 *         description: Server error
 */
router.get('/aggregate/departments', aggregateByDepartment);

/**
 * @swagger
 * /api/v1/dashboard/aggregate/brands:
 *   get:
 *     summary: Get brand-wise aggregated statistics
 *     description: |
 *       Returns aggregated CSAT statistics grouped by brand.
 *       Each brand includes a classification (excellent, good, average, critical)
 *       based on average satisfaction score.
 *     tags: [Dashboard - Aggregations]
 *     parameters:
 *       - $ref: '#/components/parameters/DepartmentIdParam'
 *       - $ref: '#/components/parameters/CycleIdParam'
 *       - $ref: '#/components/parameters/YearParam'
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of brands to return
 *     responses:
 *       200:
 *         description: Brand aggregation retrieved successfully
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
 *                     $ref: '#/components/schemas/BrandAggregation'
 *       500:
 *         description: Server error
 */
router.get('/aggregate/brands', aggregateByBrand);

/**
 * @swagger
 * /api/v1/dashboard/aggregate/sbus:
 *   get:
 *     summary: Get SBU-wise aggregated statistics
 *     description: |
 *       Returns aggregated CSAT statistics grouped by SBU/POD.
 *       Includes leadership information and performance classification.
 *     tags: [Dashboard - Aggregations]
 *     parameters:
 *       - $ref: '#/components/parameters/CycleIdParam'
 *       - $ref: '#/components/parameters/YearParam'
 *     responses:
 *       200:
 *         description: SBU aggregation retrieved successfully
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
 *                     $ref: '#/components/schemas/SBUAggregation'
 *       500:
 *         description: Server error
 */
router.get('/aggregate/sbus', aggregateBySBU);

/**
 * @swagger
 * /api/v1/dashboard/aggregate/cycles:
 *   get:
 *     summary: Get cycle-wise comparison statistics
 *     description: |
 *       Returns aggregated CSAT statistics grouped by cycle.
 *       Useful for tracking performance trends over time.
 *     tags: [Dashboard - Aggregations]
 *     parameters:
 *       - $ref: '#/components/parameters/DepartmentIdParam'
 *       - $ref: '#/components/parameters/YearParam'
 *     responses:
 *       200:
 *         description: Cycle comparison retrieved successfully
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
 *                     $ref: '#/components/schemas/CycleAggregation'
 *       500:
 *         description: Server error
 */
router.get('/aggregate/cycles', aggregateByCycle);

// ============================================
// Detail Views
// ============================================

/**
 * @swagger
 * /api/v1/dashboard/department/{departmentId}/records:
 *   get:
 *     summary: Get department records with POC details
 *     description: |
 *       Returns a detailed records table for a department including
 *       individual POC-level CSAT data with search and filtering.
 *     tags: [Dashboard - Detail Views]
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the department
 *       - $ref: '#/components/parameters/CycleIdParam'
 *       - $ref: '#/components/parameters/YearParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Department records retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/department/:departmentId/records', getDepartmentRecords);

/**
 * @swagger
 * /api/v1/dashboard/sbu/{sbuId}/detail:
 *   get:
 *     summary: Get SBU detail with individual responses
 *     description: |
 *       Returns detailed SBU information including all individual CSAT responses.
 *       Supports comprehensive filtering by cycle, year, date range, and department.
 *     tags: [Dashboard - Detail Views]
 *     parameters:
 *       - in: path
 *         name: sbuId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the SBU
 *       - $ref: '#/components/parameters/CycleIdParam'
 *       - $ref: '#/components/parameters/YearParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *       - $ref: '#/components/parameters/DepartmentIdParam'
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: SBU detail retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/sbu/:sbuId/detail', getSBUDetail);

/**
 * @swagger
 * /api/v1/dashboard/response/{id}:
 *   get:
 *     summary: Get single CSAT response by ID
 *     description: |
 *       Returns a single CSAT response with all details including
 *       fully populated brand, client, department, cycle, and SBU information.
 *       Calculated CSAT and NPS scores are included.
 *     tags: [Dashboard - Detail Views]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the CSAT response
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Response retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CSATResponse'
 *       404:
 *         description: Response not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Response not found"
 *       500:
 *         description: Server error
 */
router.get('/response/:id', getResponse);

export default router;
