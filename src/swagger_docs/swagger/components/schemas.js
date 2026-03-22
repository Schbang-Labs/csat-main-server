/**
 * Swagger Component Schemas
 * Defines all reusable data models for the API documentation
 */

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
 *       description: Department entity representing a service department
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB ObjectId
 *           example: "507f1f77bcf86cd799439011"
 *         name:
 *           type: string
 *           description: Department code/identifier
 *           enum: [solutions, media, tech, seo, martech, fluence, smp]
 *           example: "solutions"
 *         displayName:
 *           type: string
 *           description: Human-readable department name
 *           example: "Solutions"
 *         services:
 *           type: array
 *           description: Service ObjectIds mapped to this department
 *           items:
 *             type: string
 *             example: "507f1f77bcf86cd799439099"
 *         hasSBUs:
 *           type: boolean
 *           description: Whether this department has SBU/POD structure
 *           example: true
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *     Service:
 *       type: object
 *       description: Department-scoped service master data
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439099"
 *         name:
 *           type: string
 *           description: Service display name
 *           example: "Performance Marketing"
 *         normalizedName:
 *           type: string
 *           description: Normalized key used for lookups
 *           example: "performance marketing"
 *         departmentId:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/Department'
 *         description:
 *           type: string
 *           example: "Paid media performance service"
 *         isActive:
 *           type: boolean
 *           example: true
 *     
 *     Brand:
 *       type: object
 *       description: Brand/Client company entity
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB ObjectId
 *           example: "507f1f77bcf86cd799439011"
 *         name:
 *           type: string
 *           description: Brand name
 *           example: "Tata Motors"
 *         slug:
 *           type: string
 *           description: URL-friendly identifier (auto-generated from name)
 *           example: "tata-motors"
 *         secondBrainId:
 *           type: number
 *           nullable: true
 *           description: Second Brain integration ID
 *           example: 12345
 *         services:
 *           type: array
 *           description: Department-service mappings for this brand
 *           items:
 *             $ref: '#/components/schemas/BrandService'
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     BrandService:
 *       type: object
 *       description: Service mapping for a brand to a department
 *       properties:
 *         department:
 *           type: string
 *           enum: [solutions, media, tech, seo, martech, fluence, smp]
 *           description: Department code
 *           example: "solutions"
 *         sbuId:
 *           type: string
 *           nullable: true
 *           description: SBU/POD ObjectId assigned to this service
 *           example: "507f1f77bcf86cd799439012"
 *         subservices:
 *           type: array
 *           description: Service ObjectIds mapped under this department
 *           items:
 *             type: string
 *             example: "507f1f77bcf86cd799439099"
 *         isActive:
 *           type: boolean
 *           example: true
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: null means ongoing
 *     
 *     Client:
 *       type: object
 *       description: Client Point of Contact (POC) entity
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         brandId:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/Brand'
 *           description: Brand ObjectId or populated Brand object
 *         name:
 *           type: string
 *           description: POC full name
 *           example: "John Doe"
 *         phone:
 *           type: string
 *           description: Phone number (unique per brand)
 *           example: "9876543210"
 *         email:
 *           type: string
 *           format: email
 *           example: "john@company.com"
 *         serviceMapping:
 *           type: array
 *           description: Departments this POC is responsible for
 *           items:
 *             type: object
 *             properties:
 *               department:
 *                 type: string
 *                 enum: [solutions, media, tech, seo, martech, fluence, smp]
 *               subservices:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: "507f1f77bcf86cd799439099"
 *               isActive:
 *                 type: boolean
 *         isActive:
 *           type: boolean
 *           example: true
 *     
 *     SBU:
 *       type: object
 *       description: Strategic Business Unit (SBU) / POD entity
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         name:
 *           type: string
 *           description: SBU/POD name
 *           example: "POD Phoenix"
 *         slug:
 *           type: string
 *           description: URL-friendly identifier
 *           example: "pod-phoenix"
 *         departmentId:
 *           oneOf:
 *             - type: string
 *             - $ref: '#/components/schemas/Department'
 *           description: Department this SBU belongs to
 *         executiveVP:
 *           type: string
 *           description: Executive Vice President name
 *           example: "John Smith"
 *         associateVP:
 *           type: string
 *           description: Associate Vice President name (single)
 *           example: "Jane Doe"
 *         associateVPs:
 *           type: array
 *           description: Multiple Associate VPs (for departments with multiple)
 *           items:
 *             type: string
 *           example: ["Jane Doe", "Bob Wilson"]
 *         creativeDirector:
 *           type: string
 *           description: Creative Director name (primarily for Solutions)
 *           example: "Alice Johnson"
 *         leadNames:
 *           type: array
 *           description: Lead names for combined PODs
 *           items:
 *             type: string
 *         brands:
 *           type: array
 *           description: Brand ObjectIds assigned to this SBU
 *           items:
 *             type: string
 *         isActive:
 *           type: boolean
 *           example: true
 *     
 *     Cycle:
 *       type: object
 *       description: CSAT survey cycle entity
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         name:
 *           type: string
 *           description: Cycle display name
 *           example: "Cycle 5 - 2025"
 *         cycleNumber:
 *           type: integer
 *           description: Cycle number within the year (1-6)
 *           minimum: 1
 *           maximum: 6
 *           example: 5
 *         year:
 *           type: integer
 *           description: Year of the cycle
 *           example: 2025
 *         status:
 *           type: string
 *           enum: [upcoming, active, completed]
 *           description: Current cycle status
 *           example: "active"
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         isFinalized:
 *           type: boolean
 *           description: Whether history snapshots have been created
 *         isActive:
 *           type: boolean
 *     
 *     # ============================================
 *     # CSAT Response
 *     # ============================================
 *     
 *     CSATResponse:
 *       type: object
 *       description: Individual CSAT survey response
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
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
 *         services:
 *           type: array
 *           description: Service forms filled for this response
 *           items:
 *             oneOf:
 *               - type: string
 *               - $ref: '#/components/schemas/Service'
 *         submittedAt:
 *           type: string
 *           format: date-time
 *           description: When the response was submitted
 *         csat:
 *           type: number
 *           format: float
 *           description: Calculated CSAT score (average of all metrics except NPS)
 *           example: 4.25
 *         nps:
 *           type: number
 *           description: Likelihood to recommend score (NPS metric)
 *           example: 4
 *         data:
 *           $ref: '#/components/schemas/CSATData'
 *         comment:
 *           type: string
 *           description: Optional freeform feedback
 *           example: "Great service overall!"
 *         isValid:
 *           type: boolean
 *           description: Data quality flag
 *           example: true
 *         brandHistoryId:
 *           type: string
 *           description: Historical snapshot ID for brand (for past cycles)
 *         clientHistoryId:
 *           type: string
 *           description: Historical snapshot ID for client
 *         sbuHistoryId:
 *           type: string
 *           description: Historical snapshot ID for SBU
 *     
 *     CSATData:
 *       type: object
 *       description: Raw CSAT survey metrics data (schemaless)
 *       properties:
 *         coreMetrics:
 *           type: object
 *           description: Core satisfaction metrics
 *           properties:
 *             overallSatisfaction:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *               description: Overall satisfaction rating
 *               example: 4
 *             likelihoodToRecommend:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *               description: NPS - Likelihood to recommend
 *               example: 5
 *             northStarMetrics:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *               example: 4
 *             seniorLeadershipInvolvement:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *               example: 4
 *             strategyExecution:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *               example: 4
 *         deliveryMetrics:
 *           type: object
 *           description: Service delivery metrics
 *           properties:
 *             teamResponsiveness:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *               example: 5
 *             brandUnderstanding:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *               example: 4
 *             dataEffectiveness:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *               example: 4
 *             teamProactivity:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *               example: 4
 *             meetingBusinessGoals:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *               example: 4
 *         qualityEvaluation:
 *           type: object
 *           description: Quality evaluation metrics
 *           properties:
 *             qualityOfDesignVideo:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *               example: 4
 *             qualityOfIdeas:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *               example: 5
 *     
 *     # ============================================
 *     # Request Bodies
 *     # ============================================
 *     
 *     CreateSBURequest:
 *       type: object
 *       description: Request body for creating a new SBU
 *       required:
 *         - name
 *         - departmentId
 *       properties:
 *         name:
 *           type: string
 *           description: SBU/POD name
 *           example: "POD Phoenix"
 *         departmentId:
 *           type: string
 *           description: MongoDB ObjectId of the department
 *           example: "507f1f77bcf86cd799439011"
 *         executiveVP:
 *           type: string
 *           description: Executive VP name
 *           example: "John Smith"
 *         associateVP:
 *           type: string
 *           description: Single Associate VP name
 *           example: "Jane Doe"
 *         associateVPs:
 *           type: array
 *           description: Multiple Associate VPs
 *           items:
 *             type: string
 *           example: ["Jane Doe", "Bob Wilson"]
 *         creativeDirector:
 *           type: string
 *           description: Creative Director name
 *           example: "Alice Johnson"
 *         leadNames:
 *           type: array
 *           description: Lead names for combined PODs
 *           items:
 *             type: string
 *         brands:
 *           type: array
 *           description: Array of Brand ObjectIds to assign
 *           items:
 *             type: string
 *           example: ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
 *     
 *     UpdateSBURequest:
 *       type: object
 *       description: Request body for updating an SBU (all fields optional)
 *       properties:
 *         name:
 *           type: string
 *         executiveVP:
 *           type: string
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
 *         isActive:
 *           type: boolean
 *     
 *     CreateBrandRequest:
 *       type: object
 *       description: Request body for creating a new Brand
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Brand name
 *           example: "Tata Motors"
 *         slug:
 *           type: string
 *           description: URL-friendly slug (auto-generated from name if not provided)
 *           example: "tata-motors"
 *         secondBrainId:
 *           type: number
 *           description: Second Brain integration ID
 *           example: 12345
 *         services:
 *           type: array
 *           description: Department-service mappings
 *           items:
 *             type: object
 *             required:
 *               - department
 *             properties:
 *               department:
 *                 type: string
 *                 enum: [solutions, media, tech, seo, martech, fluence, smp]
 *                 example: "solutions"
 *               sbuId:
 *                 type: string
 *                 description: SBU ObjectId for this service
 *                 example: "507f1f77bcf86cd799439011"
 *               subservices:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: "507f1f77bcf86cd799439099"
 *     
 *     UpdateBrandRequest:
 *       type: object
 *       description: Request body for updating a Brand (all fields optional)
 *       properties:
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *         secondBrainId:
 *           type: number
 *         services:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               department:
 *                 type: string
 *               sbuId:
 *                 type: string
 *               subservices:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *         isActive:
 *           type: boolean
 *     
 *     CreateClientRequest:
 *       type: object
 *       description: Request body for creating a new Client/POC
 *       required:
 *         - brandId
 *         - name
 *         - phone
 *       properties:
 *         brandId:
 *           type: string
 *           description: MongoDB ObjectId of the brand
 *           example: "507f1f77bcf86cd799439011"
 *         name:
 *           type: string
 *           description: POC full name
 *           example: "John Doe"
 *         phone:
 *           type: string
 *           description: Phone number
 *           example: "9876543210"
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *           example: "john@company.com"
 *         serviceMapping:
 *           type: array
 *           description: Departments this POC handles
 *           items:
 *             type: object
 *             properties:
 *               department:
 *                 type: string
 *                 enum: [solutions, media, tech, seo, martech, fluence, smp]
 *               subservices:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: "507f1f77bcf86cd799439099"
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     
 *     UpdateClientRequest:
 *       type: object
 *       description: Request body for updating a Client (all fields optional)
 *       properties:
 *         name:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         serviceMapping:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               department:
 *                 type: string
 *               subservices:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *         isActive:
 *           type: boolean
 *     
 *     CreateServiceRequest:
 *       type: object
 *       description: Request body for creating a Service
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "Performance Marketing"
 *         departmentId:
 *           type: string
 *           description: Department ObjectId
 *         departmentName:
 *           type: string
 *           enum: [solutions, media, tech, seo, martech, fluence, smp]
 *         description:
 *           type: string
 *           example: "Paid media performance services"
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *     UpdateServiceRequest:
 *       type: object
 *       description: Request body for updating a Service
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         isActive:
 *           type: boolean
 *
 *     UpdateBrandPocsRequest:
 *       type: object
 *       description: Request body for updating Brand POCs
 *       required:
 *         - pocs
 *       properties:
 *         pocs:
 *           type: array
 *           description: Array of POC ObjectIds
 *           items:
 *             type: string
 *           example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *     
 *     CSATWebhookRequest:
 *       type: object
 *       description: Request body for CSAT webhook from Pabbly
 *       required:
 *         - clientPhone
 *         - departmentName
 *       properties:
 *         clientPhone:
 *           type: string
 *           description: POC phone number
 *           example: "9876543210"
 *         departmentName:
 *           type: string
 *           enum: [solutions, media, tech, seo, martech, fluence, smp]
 *           description: Department code
 *           example: "solutions"
 *         service:
 *           type: string
 *           description: Service name for service-form submissions
 *           example: "Performance Marketing"
 *         data:
 *           type: object
 *           description: Raw form payload object (core form or service form)
 *           additionalProperties: true
 *           example:
 *             coreMetrics:
 *               overallSatisfaction: 4
 *               likelihoodToRecommend: 5
 *             comment: "Great service overall!"
 *     
 *     # ============================================
 *     # Response Wrappers
 *     # ============================================
 *     
 *     SuccessResponse:
 *       type: object
 *       description: Standard success response wrapper
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           description: Response payload
 *     
 *     SuccessResponseWithCount:
 *       type: object
 *       description: Success response with count
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         count:
 *           type: integer
 *           description: Number of items returned
 *           example: 25
 *         data:
 *           type: array
 *           items:
 *             type: object
 *     
 *     ErrorResponse:
 *       type: object
 *       description: Standard error response wrapper
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           description: Error type/title
 *           example: "Validation Error"
 *         message:
 *           type: string
 *           description: Detailed error message
 *           example: "Required field 'name' is missing"
 *     
 *     PaginationInfo:
 *       type: object
 *       description: Pagination metadata
 *       properties:
 *         page:
 *           type: integer
 *           description: Current page number
 *           example: 1
 *         limit:
 *           type: integer
 *           description: Items per page
 *           example: 50
 *         total:
 *           type: integer
 *           description: Total items matching filter
 *           example: 123
 *         pages:
 *           type: integer
 *           description: Total number of pages
 *           example: 3
 *         hasNext:
 *           type: boolean
 *           description: Whether there are more pages
 *           example: true
 *         hasPrev:
 *           type: boolean
 *           description: Whether there are previous pages
 *           example: false
 *     
 *     AggregateScores:
 *       type: object
 *       description: Aggregated CSAT and NPS scores
 *       properties:
 *         avgCSAT:
 *           type: number
 *           format: float
 *           description: Average CSAT score (1-5)
 *           example: 4.25
 *         avgNPS:
 *           type: number
 *           format: float
 *           description: Average NPS/Likelihood to recommend (1-5)
 *           example: 4.1
 *         totalResponses:
 *           type: integer
 *           description: Number of responses in calculation
 *           example: 123
 *     
 *     FillRates:
 *       type: object
 *       description: Brand and POC fill rate statistics
 *       properties:
 *         departmentFilter:
 *           type: string
 *           description: Applied department filter or 'all'
 *           example: "solutions"
 *         sbuFilter:
 *           type: string
 *           description: Applied SBU filter or 'all'
 *           example: "POD Phoenix"
 *         totalMappedBrands:
 *           type: integer
 *           description: Total brands mapped to filter scope
 *           example: 150
 *         totalBrandsFilled:
 *           type: integer
 *           description: Brands with at least one CSAT response
 *           example: 120
 *         totalBrandsUnfilled:
 *           type: integer
 *           description: Brands without CSAT responses
 *           example: 30
 *         totalPOCs:
 *           type: integer
 *           description: Total POCs in scope
 *           example: 300
 *         totalPOCsFilled:
 *           type: integer
 *           description: POCs who submitted CSAT
 *           example: 200
 *         totalPOCsUnfilled:
 *           type: integer
 *           description: POCs who haven't submitted
 *           example: 100
 *         brandFillRate:
 *           type: number
 *           format: float
 *           description: Percentage of brands filled
 *           example: 80.0
 *         pocFillRate:
 *           type: number
 *           format: float
 *           description: Percentage of POCs filled
 *           example: 66.67
 *     
 *     # ============================================
 *     # Filter Response Types
 *     # ============================================
 *     
 *     FilterOptionsResponse:
 *       type: object
 *       description: Available filter options for dashboard
 *       properties:
 *         departments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Department'
 *         brands:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *         cycles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Cycle'
 *         sbus:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SBU'
 *         years:
 *           type: array
 *           items:
 *             type: integer
 *           example: [2025, 2024, 2023]
 *     
 *     FilteredResponseData:
 *       type: object
 *       description: Response data from filter endpoints
 *       properties:
 *         aggregates:
 *           $ref: '#/components/schemas/AggregateScores'
 *         fillRates:
 *           $ref: '#/components/schemas/FillRates'
 *         responses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CSATResponse'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationInfo'
 *     
 *     # ============================================
 *     # Aggregation Response Types
 *     # ============================================
 *     
 *     DepartmentAggregation:
 *       type: object
 *       description: Department-wise aggregated statistics
 *       properties:
 *         departmentId:
 *           type: string
 *         departmentName:
 *           type: string
 *           example: "solutions"
 *         totalResponses:
 *           type: integer
 *           example: 45
 *         avgSatisfaction:
 *           type: number
 *           format: float
 *           example: 4.2
 *         avgNPS:
 *           type: number
 *           format: float
 *           example: 4.0
 *         brandCount:
 *           type: integer
 *           example: 12
 *     
 *     BrandAggregation:
 *       type: object
 *       description: Brand-wise aggregated statistics
 *       properties:
 *         brandId:
 *           type: string
 *         brandName:
 *           type: string
 *           example: "Tata Motors"
 *         brandSlug:
 *           type: string
 *           example: "tata-motors"
 *         totalResponses:
 *           type: integer
 *           example: 5
 *         avgSatisfaction:
 *           type: number
 *           format: float
 *           example: 4.4
 *         avgNPS:
 *           type: number
 *           format: float
 *           example: 4.2
 *         pocCount:
 *           type: integer
 *           example: 3
 *         classification:
 *           type: string
 *           enum: [excellent, good, average, critical]
 *           example: "excellent"
 *     
 *     SBUAggregation:
 *       type: object
 *       description: SBU-wise aggregated statistics
 *       properties:
 *         sbuId:
 *           type: string
 *         sbuName:
 *           type: string
 *           example: "POD Phoenix"
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
 *         totalResponses:
 *           type: integer
 *           example: 20
 *         avgSatisfaction:
 *           type: number
 *           format: float
 *           example: 4.1
 *         avgNPS:
 *           type: number
 *           format: float
 *           example: 4.0
 *         brandCount:
 *           type: integer
 *           example: 8
 *         classification:
 *           type: string
 *           enum: [good, average, critical]
 *           example: "good"
 *     
 *     CycleAggregation:
 *       type: object
 *       description: Cycle-wise comparison statistics
 *       properties:
 *         cycleId:
 *           type: string
 *         cycleName:
 *           type: string
 *           example: "Cycle 5 - 2025"
 *         cycleNumber:
 *           type: integer
 *           example: 5
 *         year:
 *           type: integer
 *           example: 2025
 *         totalResponses:
 *           type: integer
 *           example: 123
 *         avgSatisfaction:
 *           type: number
 *           format: float
 *           example: 4.2
 *         avgNPS:
 *           type: number
 *           format: float
 *           example: 4.1
 *         brandCount:
 *           type: integer
 *           example: 50
 *     
 *     # ============================================
 *     # History Entities
 *     # ============================================
 *     
 *     SBUHistory:
 *       type: object
 *       description: Historical snapshot of SBU at a specific cycle
 *       properties:
 *         _id:
 *           type: string
 *         sbuId:
 *           type: string
 *           description: Reference to current SBU
 *         cycleId:
 *           type: string
 *         name:
 *           type: string
 *         executiveVP:
 *           type: string
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
 *         snapshotAt:
 *           type: string
 *           format: date-time
 *     
 *     BrandHistory:
 *       type: object
 *       description: Historical snapshot of Brand at a specific cycle
 *       properties:
 *         _id:
 *           type: string
 *         brandId:
 *           type: string
 *         cycleId:
 *           type: string
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *         services:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BrandService'
 *         snapshotAt:
 *           type: string
 *           format: date-time
 *     
 *     ClientHistory:
 *       type: object
 *       description: Historical snapshot of Client at a specific cycle
 *       properties:
 *         _id:
 *           type: string
 *         clientId:
 *           type: string
 *         cycleId:
 *           type: string
 *         brandId:
 *           type: string
 *         name:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         serviceMapping:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               department:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *         snapshotAt:
 *           type: string
 *           format: date-time
 *   
 *   # ============================================
 *   # Common Parameters
 *   # ============================================
 *   parameters:
 *     PageParam:
 *       in: query
 *       name: page
 *       schema:
 *         type: integer
 *         minimum: 1
 *         default: 1
 *       description: Page number for pagination
 *     
 *     LimitParam:
 *       in: query
 *       name: limit
 *       schema:
 *         type: integer
 *         minimum: 0
 *         default: 50
 *       description: Items per page (0 = return all for exports)
 *     
 *     CycleIdParam:
 *       in: query
 *       name: cycleId
 *       schema:
 *         type: string
 *       description: Filter by Cycle ObjectId
 *     
 *     YearParam:
 *       in: query
 *       name: year
 *       schema:
 *         type: integer
 *       description: Filter by year (e.g., 2025)
 *     
 *     DepartmentIdParam:
 *       in: query
 *       name: departmentId
 *       schema:
 *         type: string
 *       description: Filter by Department ObjectId
 *     
 *     BrandIdParam:
 *       in: query
 *       name: brandId
 *       schema:
 *         type: string
 *       description: Filter by Brand ObjectId
 *     
 *     SbuIdParam:
 *       in: query
 *       name: sbuId
 *       schema:
 *         type: string
 *       description: Filter by SBU ObjectId
 *     
 *     ExportParam:
 *       in: query
 *       name: export
 *       schema:
 *         type: string
 *         enum: [csv]
 *       description: Export format. Add ?export=csv to download as CSV file.
 *     
 *     SearchParam:
 *       in: query
 *       name: search
 *       schema:
 *         type: string
 *       description: Search term for filtering results
 */
