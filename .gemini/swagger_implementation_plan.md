# 📚 Swagger API Documentation - Implementation Plan

## Executive Summary

This plan outlines the implementation of comprehensive Swagger/OpenAPI 3.0 documentation for the CSAT Main Server API. The documentation will cover all **35+ endpoints** across 4 route groups with complete request/response schemas.

---

## 📋 Current API Inventory

### 1. Dashboard Routes (`/api/v1/dashboard`) - 16 Endpoints

| Method | Endpoint                            | Description                         |
| ------ | ----------------------------------- | ----------------------------------- |
| GET    | `/filters`                          | Get all available filter options    |
| GET    | `/brands-filled`                    | Get brands filled/unfilled coverage |
| GET    | `/recent`                           | Get recent CSAT responses           |
| GET    | `/search`                           | Global search across CSAT data      |
| GET    | `/filter/department/:departmentId`  | Filter by department + CSV export   |
| GET    | `/filter/brand/:brandId`            | Filter by brand + CSV export        |
| GET    | `/filter/cycle/:cycleId`            | Filter by cycle + CSV export        |
| GET    | `/filter/year/:year`                | Filter by year + CSV export         |
| GET    | `/filter/sbu/:sbuId`                | Filter by SBU + CSV export          |
| GET    | `/stats`                            | Get dashboard statistics            |
| GET    | `/aggregate/departments`            | Department-wise aggregation         |
| GET    | `/aggregate/brands`                 | Brand-wise aggregation              |
| GET    | `/aggregate/sbus`                   | SBU-wise aggregation                |
| GET    | `/aggregate/cycles`                 | Cycle-wise comparison               |
| GET    | `/department/:departmentId/records` | Department records with POC details |
| GET    | `/sbu/:sbuId/detail`                | SBU detail with responses           |
| GET    | `/response/:id`                     | Single CSAT response detail         |

### 2. Admin Routes (`/api/v1/admin`) - 17 Endpoints

| Method | Endpoint                    | Description                          |
| ------ | --------------------------- | ------------------------------------ |
| GET    | `/sbus`                     | Get all SBUs                         |
| GET    | `/sbus/:id`                 | Get SBU by ID (with history support) |
| GET    | `/sbus/:id/history`         | Get SBU change history               |
| POST   | `/sbus`                     | Create new SBU                       |
| PUT    | `/sbus/:id`                 | Update SBU                           |
| GET    | `/clients`                  | Get all Clients/POCs                 |
| GET    | `/clients/:id`              | Get Client by ID                     |
| GET    | `/clients/:id/history`      | Get Client change history            |
| POST   | `/clients`                  | Create new Client                    |
| PUT    | `/clients/:id`              | Update Client                        |
| GET    | `/brands`                   | Get all Brands                       |
| GET    | `/brands/:id`               | Get Brand by ID                      |
| GET    | `/brands/:id/history`       | Get Brand change history             |
| POST   | `/brands`                   | Create new Brand                     |
| PUT    | `/brands/:id`               | Update Brand                         |
| PUT    | `/brands/:id/pocs`          | Update Brand POCs                    |
| GET    | `/cycles`                   | Get all Cycles                       |
| POST   | `/cycles/:cycleId/finalize` | Finalize cycle & create snapshots    |

### 3. Webhook Routes (`/api/v1/webhook`) - 1 Endpoint

| Method | Endpoint | Description                   |
| ------ | -------- | ----------------------------- |
| POST   | `/csat`  | Receive CSAT data from Pabbly |

### 4. Health & Root Routes - 2 Endpoints

| Method | Endpoint  | Description            |
| ------ | --------- | ---------------------- |
| GET    | `/health` | Health check           |
| GET    | `/api/v1` | API documentation info |

---

## 🏗️ Implementation Architecture

### Technology Stack

```
swagger-jsdoc     - Parse JSDoc comments to OpenAPI spec
swagger-ui-express - Serve interactive Swagger UI
```

### File Structure

```
src/
├── docs/
│   └── swagger/
│       ├── swagger.js           # Main Swagger config
│       ├── components/
│       │   ├── schemas.js       # All data schemas
│       │   ├── parameters.js    # Reusable parameters
│       │   └── responses.js     # Standard responses
│       └── paths/
│           ├── dashboard.js     # Dashboard route docs
│           ├── admin.js         # Admin route docs
│           └── webhook.js       # Webhook route docs
├── routes/
│   ├── dashboard.routes.js      # Add JSDoc comments
│   ├── admin.routes.js          # Add JSDoc comments
│   └── webhook.routes.js        # Add JSDoc comments
└── app.js                       # Mount swagger-ui
```

---

## 📦 Phase 1: Setup & Configuration (Day 1)

### Step 1.1: Install Dependencies

```bash
npm install swagger-jsdoc swagger-ui-express
```

### Step 1.2: Create Swagger Configuration

Create `/src/docs/swagger/swagger.js`:

```javascript
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CSAT Main Server API',
      version: '1.0.0',
      description: `
## CSAT Dashboard API Documentation

Comprehensive API for managing CSAT (Customer Satisfaction) survey data, 
including dashboard analytics, admin management, and webhook integrations.

### Features
- 📊 **Dashboard**: Filter, aggregate, and analyze CSAT responses
- 🔧 **Admin**: Manage SBUs, Brands, Clients, and Cycles
- 🔗 **Webhooks**: Receive external CSAT submissions
- 📥 **CSV Export**: Add \`?export=csv\` to filter endpoints

### Authentication
Currently all endpoints are public. Authentication will be added in future versions.

### Rate Limiting
No rate limiting is currently enforced.
      `,
      contact: {
        name: 'Schbang Tech Team',
        email: 'tech@schbang.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.csat.schbang.com',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Dashboard',
        description: 'CSAT dashboard data retrieval and filtering',
      },
      {
        name: 'Dashboard - Filters',
        description: 'Filter CSAT responses by various entities',
      },
      {
        name: 'Dashboard - Aggregations',
        description: 'Aggregated statistics and comparisons',
      },
      {
        name: 'Admin - SBU',
        description: 'Strategic Business Unit management',
      },
      {
        name: 'Admin - Brand',
        description: 'Brand/Client management',
      },
      {
        name: 'Admin - Client',
        description: 'Client/POC management',
      },
      {
        name: 'Admin - Cycle',
        description: 'CSAT cycle management',
      },
      {
        name: 'Webhook',
        description: 'External webhook integrations',
      },
      {
        name: 'Health',
        description: 'System health and status',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/docs/swagger/components/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
export { swaggerUi };
```

### Step 1.3: Mount Swagger UI in app.js

```javascript
import { swaggerSpec, swaggerUi } from './docs/swagger/swagger.js';

// Swagger docs
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CSAT API Documentation',
  })
);

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.json(swaggerSpec);
});
```

---

## 📦 Phase 2: Define Component Schemas (Day 1-2)

### Step 2.1: Create Schema Definitions

Create `/src/docs/swagger/components/schemas.js`:

```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     # ============================================
 *     # Base Entities
 *     # ============================================
 *
 *     Department:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         name:
 *           type: string
 *           enum: [solutions, media, tech, seo, martech, fluence, smp]
 *           example: "solutions"
 *         displayName:
 *           type: string
 *           example: "Solutions"
 *         hasSBUs:
 *           type: boolean
 *           example: true
 *
 *     Brand:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         name:
 *           type: string
 *           example: "Tata Motors"
 *         slug:
 *           type: string
 *           example: "tata-motors"
 *         secondBrainId:
 *           type: number
 *           nullable: true
 *           example: 12345
 *         services:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BrandService'
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *     BrandService:
 *       type: object
 *       properties:
 *         department:
 *           type: string
 *           enum: [solutions, media, tech, seo, martech, fluence, smp]
 *         sbuId:
 *           type: string
 *           nullable: true
 *         isActive:
 *           type: boolean
 *
 *     Client:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         brandId:
 *           type: string
 *         name:
 *           type: string
 *           example: "John Doe"
 *         phone:
 *           type: string
 *           example: "9876543210"
 *         email:
 *           type: string
 *           example: "john@company.com"
 *         serviceMapping:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               department:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *
 *     SBU:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *           example: "POD Phoenix"
 *         slug:
 *           type: string
 *           example: "pod-phoenix"
 *         departmentId:
 *           type: string
 *         executiveVP:
 *           type: string
 *           example: "John Smith"
 *         associateVP:
 *           type: string
 *           example: "Jane Doe"
 *         associateVPs:
 *           type: array
 *           items:
 *             type: string
 *         creativeDirector:
 *           type: string
 *         leadNames:
 *           type: array
 *           items:
 *             type: string
 *         brands:
 *           type: array
 *           items:
 *             type: string
 *
 *     Cycle:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *           example: "Cycle 5 - 2025"
 *         cycleNumber:
 *           type: number
 *           example: 5
 *         year:
 *           type: number
 *           example: 2025
 *         status:
 *           type: string
 *           enum: [upcoming, active, completed]
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *
 *     # ============================================
 *     # CSAT Response
 *     # ============================================
 *
 *     CSATResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         brandId:
 *           $ref: '#/components/schemas/Brand'
 *         clientId:
 *           $ref: '#/components/schemas/Client'
 *         departmentId:
 *           $ref: '#/components/schemas/Department'
 *         cycleId:
 *           $ref: '#/components/schemas/Cycle'
 *         sbuId:
 *           $ref: '#/components/schemas/SBU'
 *         submittedAt:
 *           type: string
 *           format: date-time
 *         csat:
 *           type: number
 *           description: Calculated CSAT score (avg of all metrics except NPS)
 *           example: 4.25
 *         nps:
 *           type: number
 *           description: Likelihood to recommend score
 *           example: 4
 *         data:
 *           $ref: '#/components/schemas/CSATData'
 *         comment:
 *           type: string
 *         isValid:
 *           type: boolean
 *
 *     CSATData:
 *       type: object
 *       description: Raw CSAT survey data (schemaless)
 *       properties:
 *         coreMetrics:
 *           type: object
 *           properties:
 *             overallSatisfaction:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *             likelihoodToRecommend:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *             northStarMetrics:
 *               type: number
 *             seniorLeadershipInvolvement:
 *               type: number
 *             strategyExecution:
 *               type: number
 *         deliveryMetrics:
 *           type: object
 *           properties:
 *             teamResponsiveness:
 *               type: number
 *             brandUnderstanding:
 *               type: number
 *             dataEffectiveness:
 *               type: number
 *             teamProactivity:
 *               type: number
 *             meetingBusinessGoals:
 *               type: number
 *         qualityEvaluation:
 *           type: object
 *           properties:
 *             qualityOfDesignVideo:
 *               type: number
 *             qualityOfIdeas:
 *               type: number
 *
 *     # ============================================
 *     # Request Bodies
 *     # ============================================
 *
 *     CreateSBURequest:
 *       type: object
 *       required:
 *         - name
 *         - departmentId
 *       properties:
 *         name:
 *           type: string
 *           example: "POD Phoenix"
 *         departmentId:
 *           type: string
 *           description: ObjectId of the department
 *         executiveVP:
 *           type: string
 *           example: "John Smith"
 *         associateVP:
 *           type: string
 *         associateVPs:
 *           type: array
 *           items:
 *             type: string
 *         creativeDirector:
 *           type: string
 *         leadNames:
 *           type: array
 *           items:
 *             type: string
 *         brands:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of Brand ObjectIds
 *
 *     CreateBrandRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "Tata Motors"
 *         slug:
 *           type: string
 *           description: Auto-generated from name if not provided
 *         secondBrainId:
 *           type: number
 *         services:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               department:
 *                 type: string
 *                 enum: [solutions, media, tech, seo, martech, fluence, smp]
 *               sbuId:
 *                 type: string
 *
 *     CreateClientRequest:
 *       type: object
 *       required:
 *         - brandId
 *         - name
 *         - phone
 *       properties:
 *         brandId:
 *           type: string
 *           description: ObjectId of the brand
 *         name:
 *           type: string
 *           example: "John Doe"
 *         phone:
 *           type: string
 *           example: "9876543210"
 *         email:
 *           type: string
 *           example: "john@company.com"
 *         serviceMapping:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               department:
 *                 type: string
 *
 *     CSATWebhookRequest:
 *       type: object
 *       required:
 *         - brandName
 *         - clientName
 *         - clientPhone
 *         - departmentName
 *       properties:
 *         brandName:
 *           type: string
 *           example: "Tata Motors"
 *         clientName:
 *           type: string
 *           example: "John Doe"
 *         clientPhone:
 *           type: string
 *           example: "9876543210"
 *         departmentName:
 *           type: string
 *           enum: [solutions, media, tech, seo, martech, fluence, smp]
 *         overallSatisfaction:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         likelihoodToRecommend:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         northStarMetrics:
 *           type: number
 *         seniorLeadershipInvolvement:
 *           type: number
 *         strategyExecution:
 *           type: number
 *         teamResponsiveness:
 *           type: number
 *         brandUnderstanding:
 *           type: number
 *         dataEffectiveness:
 *           type: number
 *         teamProactivity:
 *           type: number
 *         meetingBusinessGoals:
 *           type: number
 *         qualityOfDesignVideo:
 *           type: number
 *         qualityOfIdeas:
 *           type: number
 *         comment:
 *           type: string
 *
 *     # ============================================
 *     # Response Wrappers
 *     # ============================================
 *
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *         message:
 *           type: string
 *
 *     PaginationInfo:
 *       type: object
 *       properties:
 *         page:
 *           type: number
 *           example: 1
 *         limit:
 *           type: number
 *           example: 50
 *         total:
 *           type: number
 *           example: 123
 *         pages:
 *           type: number
 *           example: 3
 *         hasNext:
 *           type: boolean
 *         hasPrev:
 *           type: boolean
 *
 *     AggregateScores:
 *       type: object
 *       properties:
 *         avgCSAT:
 *           type: number
 *           example: 4.25
 *         avgNPS:
 *           type: number
 *           example: 4.1
 *         totalResponses:
 *           type: number
 *           example: 123
 *
 *     FillRates:
 *       type: object
 *       properties:
 *         departmentFilter:
 *           type: string
 *         sbuFilter:
 *           type: string
 *         totalMappedBrands:
 *           type: number
 *         totalBrandsFilled:
 *           type: number
 *         totalBrandsUnfilled:
 *           type: number
 *         totalPOCs:
 *           type: number
 *         totalPOCsFilled:
 *           type: number
 *         totalPOCsUnfilled:
 *           type: number
 *         brandFillRate:
 *           type: number
 *           description: Percentage
 *         pocFillRate:
 *           type: number
 *           description: Percentage
 */
```

---

## 📦 Phase 3: Document Dashboard Routes (Day 2-3)

### Add JSDoc to `/src/routes/dashboard.routes.js`

Example for key endpoints:

```javascript
/**
 * @swagger
 * /api/v1/dashboard/filters:
 *   get:
 *     summary: Get all available filter options
 *     description: Returns all departments, brands, cycles, SBUs, and years available for filtering
 *     tags: [Dashboard]
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     departments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Department'
 *                     brands:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Brand'
 *                     cycles:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Cycle'
 *                     sbus:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SBU'
 *                     years:
 *                       type: array
 *                       items:
 *                         type: number
 */

/**
 * @swagger
 * /api/v1/dashboard/filter/cycle/{cycleId}:
 *   get:
 *     summary: Get CSAT responses filtered by cycle
 *     description: |
 *       Returns paginated CSAT responses for a specific cycle.
 *
 *       **CSV Export**: Add `?export=csv` to download all results as CSV file.
 *     tags: [Dashboard - Filters]
 *     parameters:
 *       - in: path
 *         name: cycleId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the cycle
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page (use 0 for all results)
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Optional department filter
 *       - in: query
 *         name: brandId
 *         schema:
 *           type: string
 *         description: Optional brand filter
 *       - in: query
 *         name: export
 *         schema:
 *           type: string
 *           enum: [csv]
 *         description: Export format (csv supported)
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
```

---

## 📦 Phase 4: Document Admin Routes (Day 3)

### Add JSDoc to `/src/routes/admin.routes.js`

Example for CRUD operations:

```javascript
/**
 * @swagger
 * /api/v1/admin/sbus:
 *   get:
 *     summary: Get all SBUs
 *     tags: [Admin - SBU]
 *     responses:
 *       200:
 *         description: List of all SBUs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SBU'
 *   post:
 *     summary: Create a new SBU
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
 *             brands: ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
 *     responses:
 *       201:
 *         description: SBU created successfully
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/admin/cycles/{cycleId}/finalize:
 *   post:
 *     summary: Finalize a cycle and create history snapshots
 *     description: |
 *       Creates historical snapshots of all entities (SBU, Brand, Client) for the specified cycle.
 *       Also updates all CSAT responses with history IDs.
 *
 *       **IMPORTANT**: This endpoint is idempotent. Calling it again for the same cycle
 *       will return 409 Conflict unless `force=true` is passed.
 *     tags: [Admin - Cycle]
 *     parameters:
 *       - in: path
 *         name: cycleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force re-finalization of already finalized cycle
 *     responses:
 *       200:
 *         description: Cycle finalized successfully
 *       409:
 *         description: Cycle already finalized
 */
```

---

## 📦 Phase 5: Document Webhook Routes (Day 3)

### Add JSDoc to `/src/routes/webhook.routes.js`

```javascript
/**
 * @swagger
 * /api/v1/webhook/csat:
 *   post:
 *     summary: Receive CSAT data from external services
 *     description: |
 *       Receives CSAT survey data from Pabbly or other webhook sources.
 *
 *       **Payload Handling**:
 *       - Accepts JSON body directly
 *       - Handles JSON string payloads (auto-parsed)
 *       - Handles nested `data` field with JSON string
 *
 *       **Matching Logic**:
 *       1. Finds or creates Brand by name
 *       2. Finds or creates Client by phone + brand
 *       3. Finds active Cycle
 *       4. Creates or updates CSAT Response
 *     tags: [Webhook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CSATWebhookRequest'
 *           example:
 *             brandName: "Tata Motors"
 *             clientName: "John Doe"
 *             clientPhone: "9876543210"
 *             departmentName: "solutions"
 *             overallSatisfaction: 4
 *             likelihoodToRecommend: 5
 *             northStarMetrics: 4
 *             seniorLeadershipInvolvement: 4
 *             strategyExecution: 4
 *             teamResponsiveness: 5
 *             brandUnderstanding: 4
 *             dataEffectiveness: 4
 *             teamProactivity: 5
 *             meetingBusinessGoals: 4
 *             qualityOfDesignVideo: 4
 *             qualityOfIdeas: 5
 *             comment: "Great service!"
 *     responses:
 *       201:
 *         description: CSAT response created
 *       200:
 *         description: CSAT response updated (existing response)
 *       400:
 *         description: Invalid payload
 */
```

---

## 📦 Phase 6: Final Integration & Testing (Day 4)

### Step 6.1: Test Swagger UI

1. Start server: `npm start`
2. Visit: `http://localhost:3000/api-docs`
3. Test each endpoint interactively

### Step 6.2: Validate OpenAPI Spec

```bash
npx @apidevtools/swagger-cli validate ./swagger-output.json
```

### Step 6.3: Export Static Documentation

```bash
# Generate static HTML
npx redoc-cli bundle http://localhost:3000/api-docs.json -o docs/api.html
```

---

## 📊 Complete Endpoint Documentation Checklist

### Dashboard Routes (16 endpoints)

- [ ] GET `/filters` - Filter options
- [ ] GET `/brands-filled` - Coverage tracking
- [ ] GET `/recent` - Recent responses
- [ ] GET `/search` - Global search
- [ ] GET `/filter/department/:departmentId` - Filter by department
- [ ] GET `/filter/brand/:brandId` - Filter by brand
- [ ] GET `/filter/cycle/:cycleId` - Filter by cycle
- [ ] GET `/filter/year/:year` - Filter by year
- [ ] GET `/filter/sbu/:sbuId` - Filter by SBU
- [ ] GET `/stats` - Statistics
- [ ] GET `/aggregate/departments` - Dept aggregation
- [ ] GET `/aggregate/brands` - Brand aggregation
- [ ] GET `/aggregate/sbus` - SBU aggregation
- [ ] GET `/aggregate/cycles` - Cycle comparison
- [ ] GET `/department/:departmentId/records` - Dept records
- [ ] GET `/sbu/:sbuId/detail` - SBU detail
- [ ] GET `/response/:id` - Single response

### Admin Routes (17 endpoints)

- [ ] GET `/sbus` - List SBUs
- [ ] GET `/sbus/:id` - Get SBU
- [ ] GET `/sbus/:id/history` - SBU history
- [ ] POST `/sbus` - Create SBU
- [ ] PUT `/sbus/:id` - Update SBU
- [ ] GET `/clients` - List clients
- [ ] GET `/clients/:id` - Get client
- [ ] GET `/clients/:id/history` - Client history
- [ ] POST `/clients` - Create client
- [ ] PUT `/clients/:id` - Update client
- [ ] GET `/brands` - List brands
- [ ] GET `/brands/:id` - Get brand
- [ ] GET `/brands/:id/history` - Brand history
- [ ] POST `/brands` - Create brand
- [ ] PUT `/brands/:id` - Update brand
- [ ] PUT `/brands/:id/pocs` - Update POCs
- [ ] GET `/cycles` - List cycles
- [ ] POST `/cycles/:cycleId/finalize` - Finalize cycle

### Webhook Routes (1 endpoint)

- [ ] POST `/csat` - Receive CSAT webhook

### Health Routes (2 endpoints)

- [ ] GET `/health` - Health check
- [ ] GET `/api/v1` - API info

---

## ⏰ Estimated Timeline

| Phase     | Description           | Duration               |
| --------- | --------------------- | ---------------------- |
| Phase 1   | Setup & Configuration | 2 hours                |
| Phase 2   | Component Schemas     | 4 hours                |
| Phase 3   | Dashboard Routes Docs | 4 hours                |
| Phase 4   | Admin Routes Docs     | 3 hours                |
| Phase 5   | Webhook Routes Docs   | 1 hour                 |
| Phase 6   | Testing & Polish      | 2 hours                |
| **Total** |                       | **~16 hours (2 days)** |

---

## 🎯 Next Steps

1. **Confirm this plan** - Let me know if you want to proceed
2. **Start Phase 1** - I'll install dependencies and create the Swagger config
3. **Iterative development** - Document routes in phases with testing

Ready to start implementation? 🚀
