import mongoose from 'mongoose';

/**
 * CSAT Response Model
 * Stores individual CSAT survey responses
 * Uses schemaless approach for the actual rating data (Mixed type)
 *
 * ARCHITECTURE:
 * - One document per response (per brand + POC + cycle + department)
 * - Core relationships stored as ObjectIds for efficient querying
 * - Raw survey data stored in schemaless 'data' field
 */
const csatResponseSchema = new mongoose.Schema(
  {
    // Core relationships
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cycle',
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    // SBU reference (current/live)
    sbuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SBU',
      default: null,
    },

    // ============================================
    // History References (for historical snapshots)
    // These preserve the exact state at the time of the cycle
    // For past cycles, use these to get accurate historical data
    // For current/live cycle, these may be null and main fields are used
    // ============================================

    // Brand snapshot at the time of this response
    brandHistoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BrandHistory',
      default: null,
    },

    // Client/POC snapshot at the time of this response
    clientHistoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientHistory',
      default: null,
    },

    // SBU snapshot at the time of this response (leadership, brands, etc.)
    sbuHistoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SBUHistory',
      default: null,
    },

    // Submission info
    submittedAt: {
      type: Date,
      default: Date.now,
    },

    /**
     * SCHEMALESS: Raw survey response data
     * Stores department-specific ratings and all form data
     *
     * Real Example (Brand Solutions):
     * {
     *   servicesCovered: {
     *     solutions: true, media: false, tech: false,
     *     seo: false, martech: false, fluence: false, smp: false
     *   },
     *   coreMetrics: {
     *     overallSatisfaction: 4,
     *     likelihoodToRecommend: 4,
     *     northStarMetrics: 4,
     *     seniorLeadershipInvolvement: 4,
     *     strategyExecution: 4,
     *     teamResponsiveness: 4,
     *     brandUnderstanding: 4
     *   },
     *   deliveryMetrics: {
     *     dataEffectiveness: 4,
     *     teamProactivity: 4,
     *     meetingBusinessGoals: 4
     *   },
     *   qualityEvaluation: {
     *     qualityOfDesignVideo: 0,
     *     qualityOfIdeas: 0
     *   },
     *   formVersion: "v1",
     *   filledAt: "2025-12-16T11:02:00.000Z"
     * }
     */
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Quick access to main comment
    comment: {
      type: String,
      trim: true,
    },

    // For data quality flagging
    isValid: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'csat_responses',
  }
);

// Indexes
csatResponseSchema.index({ brandId: 1, cycleId: 1 });
csatResponseSchema.index({ clientId: 1 });
csatResponseSchema.index({ departmentId: 1, cycleId: 1 });
csatResponseSchema.index({ sbuId: 1, cycleId: 1 });
csatResponseSchema.index({ submittedAt: -1 });

// Indexes for history references
csatResponseSchema.index({ brandHistoryId: 1 });
csatResponseSchema.index({ clientHistoryId: 1 });
csatResponseSchema.index({ sbuHistoryId: 1, cycleId: 1 });

// Compound index for common queries
csatResponseSchema.index({ cycleId: 1, departmentId: 1, sbuId: 1 });
csatResponseSchema.index({ cycleId: 1, departmentId: 1, sbuHistoryId: 1 });

// ============================================
// Static Methods
// ============================================

/**
 * Get responses by brand and cycle
 * @param {ObjectId} brandId
 * @param {ObjectId} cycleId
 * @returns {Promise<Array>}
 */
csatResponseSchema.statics.getByBrandAndCycle = async function (
  brandId,
  cycleId
) {
  return this.find({ brandId, cycleId, isValid: true })
    .populate('clientId', 'name phone email')
    .populate('departmentId', 'name')
    .populate('sbuId', 'name')
    .sort({ submittedAt: -1 });
};

/**
 * Get responses by department and cycle
 * @param {ObjectId} departmentId
 * @param {ObjectId} cycleId
 * @returns {Promise<Array>}
 */
csatResponseSchema.statics.getByDepartmentAndCycle = async function (
  departmentId,
  cycleId
) {
  return this.find({ departmentId, cycleId, isValid: true })
    .populate('brandId', 'name slug')
    .populate('clientId', 'name phone')
    .populate('sbuId', 'name')
    .sort({ submittedAt: -1 });
};

/**
 * Get responses by SBU and cycle
 * @param {ObjectId} sbuId
 * @param {ObjectId} cycleId
 * @returns {Promise<Array>}
 */
csatResponseSchema.statics.getBySBUAndCycle = async function (sbuId, cycleId) {
  return this.find({ sbuId, cycleId, isValid: true })
    .populate('brandId', 'name slug')
    .populate('clientId', 'name phone')
    .populate('departmentId', 'name')
    .sort({ submittedAt: -1 });
};

/**
 * Get latest responses (recent submissions)
 * @param {number} limit
 * @returns {Promise<Array>}
 */
csatResponseSchema.statics.getRecent = async function (limit = 50) {
  return this.find({ isValid: true })
    .populate('brandId', 'name slug')
    .populate('clientId', 'name phone')
    .populate('departmentId', 'name')
    .populate('cycleId', 'name cycleNumber year')
    .populate('sbuId', 'name')
    .sort({ submittedAt: -1 })
    .limit(limit);
};

/**
 * Get average CSAT score for a cycle
 * @param {ObjectId} cycleId
 * @returns {Promise<Object>}
 */
csatResponseSchema.statics.getCycleStats = async function (cycleId) {
  const result = await this.aggregate([
    {
      $match: { cycleId: new mongoose.Types.ObjectId(cycleId), isValid: true },
    },
    {
      $group: {
        _id: null,
        avgCsat: { $avg: '$data.coreMetrics.overallSatisfaction' },
        avgNps: { $avg: '$data.coreMetrics.likelihoodToRecommend' },
        totalResponses: { $sum: 1 },
        uniqueBrands: { $addToSet: '$brandId' },
        uniquePOCs: { $addToSet: '$clientId' },
      },
    },
    {
      $project: {
        _id: 0,
        avgCsat: { $round: ['$avgCsat', 2] },
        avgNps: { $round: ['$avgNps', 2] },
        totalResponses: 1,
        brandsFilled: { $size: '$uniqueBrands' },
        pocsFilled: { $size: '$uniquePOCs' },
      },
    },
  ]);

  return (
    result[0] || {
      avgCsat: 0,
      avgNps: 0,
      totalResponses: 0,
      brandsFilled: 0,
      pocsFilled: 0,
    }
  );
};

/**
 * Get department-wise stats for a cycle
 * @param {ObjectId} cycleId
 * @returns {Promise<Array>}
 */
csatResponseSchema.statics.getDepartmentStats = async function (cycleId) {
  return this.aggregate([
    {
      $match: { cycleId: new mongoose.Types.ObjectId(cycleId), isValid: true },
    },
    {
      $group: {
        _id: '$departmentId',
        avgCsat: { $avg: '$data.coreMetrics.overallSatisfaction' },
        avgNps: { $avg: '$data.coreMetrics.likelihoodToRecommend' },
        totalResponses: { $sum: 1 },
        uniqueBrands: { $addToSet: '$brandId' },
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
        avgCsat: { $round: ['$avgCsat', 2] },
        avgNps: { $round: ['$avgNps', 2] },
        totalResponses: 1,
        brandsFilled: { $size: '$uniqueBrands' },
      },
    },
    { $sort: { avgCsat: -1 } },
  ]);
};

/**
 * Get SBU-wise stats for a department and cycle
 * @param {ObjectId} departmentId
 * @param {ObjectId} cycleId
 * @returns {Promise<Array>}
 */
csatResponseSchema.statics.getSBUStats = async function (
  departmentId,
  cycleId
) {
  return this.aggregate([
    {
      $match: {
        departmentId: new mongoose.Types.ObjectId(departmentId),
        cycleId: new mongoose.Types.ObjectId(cycleId),
        sbuId: { $ne: null },
        isValid: true,
      },
    },
    {
      $group: {
        _id: '$sbuId',
        avgCsat: { $avg: '$data.coreMetrics.overallSatisfaction' },
        avgNps: { $avg: '$data.coreMetrics.likelihoodToRecommend' },
        totalResponses: { $sum: 1 },
        uniqueBrands: { $addToSet: '$brandId' },
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
        avgCsat: { $round: ['$avgCsat', 2] },
        avgNps: { $round: ['$avgNps', 2] },
        totalResponses: 1,
        brandsFilled: { $size: '$uniqueBrands' },
        // Classification based on CSAT score
        classification: {
          $cond: {
            if: { $gte: ['$avgCsat', 3.75] },
            then: 'good',
            else: {
              $cond: {
                if: { $gte: ['$avgCsat', 3.0] },
                then: 'average',
                else: 'critical',
              },
            },
          },
        },
      },
    },
    { $sort: { avgCsat: -1 } },
  ]);
};

/**
 * Search responses across all cycles
 * @param {string} searchTerm
 * @param {Object} options
 * @returns {Promise<Array>}
 */
csatResponseSchema.statics.search = async function (searchTerm, options = {}) {
  const { limit = 50 } = options;

  // Get brand and client IDs that match the search
  const Brand = mongoose.model('Brand');
  const Client = mongoose.model('Client');

  const [matchingBrands, matchingClients] = await Promise.all([
    Brand.find({ name: { $regex: searchTerm, $options: 'i' } }).select('_id'),
    Client.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
      ],
    }).select('_id'),
  ]);

  const brandIds = matchingBrands.map(b => b._id);
  const clientIds = matchingClients.map(c => c._id);

  return this.find({
    $or: [
      { brandId: { $in: brandIds } },
      { clientId: { $in: clientIds } },
      { comment: { $regex: searchTerm, $options: 'i' } },
    ],
    isValid: true,
  })
    .populate('brandId', 'name slug')
    .populate('clientId', 'name phone')
    .populate('departmentId', 'name')
    .populate('cycleId', 'name cycleNumber year')
    .populate('sbuId', 'name')
    .sort({ submittedAt: -1 })
    .limit(limit);
};

const CSATResponse = mongoose.model('CSATResponse', csatResponseSchema);

export default CSATResponse;
