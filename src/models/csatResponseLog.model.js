/**
 * CSAT Response Log Model
 * Tracks every CSAT webhook processing attempt (success and failure)
 * with full client context and error details for debugging
 */

import mongoose from 'mongoose';

const csatResponseLogSchema = new mongoose.Schema(
  {
    // Processing outcome
    status: {
      type: String,
      enum: ['success', 'failure'],
      required: true,
    },

    // Which step failed (null if success)
    failedAtStep: {
      type: String,
      enum: [
        'validate_payload',
        'find_client',
        'extract_brand',
        'find_department',
        'find_sbu',
        'get_cycle',
        'validate_service',
        'upsert_response',
      ],
      default: null,
    },

    // What action was taken on success
    action: {
      type: String,
      enum: ['created', 'updated'],
      default: null,
    },

    // Error details
    error: {
      message: { type: String, default: null },
      stack: { type: String, default: null },
    },

    // Reference to the CSATResponse document (if created/updated)
    csatResponseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CSATResponse',
      default: null,
    },

    // Client identifiers -- captured from payload even on failure
    clientPhone: { type: String, default: null },
    sanitizedPhone: { type: String, default: null },

    // Resolved entity names -- populated as far as the pipeline got
    clientName: { type: String, default: null },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    brandName: { type: String, default: null },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
    },
    departmentName: { type: String, default: null },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    sbuName: { type: String, default: null },
    sbuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SBU',
      default: null,
    },
    serviceName: { type: String, default: null },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      default: null,
    },
    cycleName: { type: String, default: null },
    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cycle',
      default: null,
    },

    // Raw payload for debugging
    rawPayload: { type: mongoose.Schema.Types.Mixed, default: null },

    // Timing
    durationMs: { type: Number, default: null },

    // HTTP context
    requestId: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: 'csat_response_logs',
  }
);

// Indexes
csatResponseLogSchema.index({ status: 1, createdAt: -1 });
csatResponseLogSchema.index({ clientPhone: 1 });
csatResponseLogSchema.index({ brandId: 1, createdAt: -1 });
csatResponseLogSchema.index({ createdAt: -1 });
csatResponseLogSchema.index({ failedAtStep: 1, status: 1 });

/**
 * Get recent logs
 */
csatResponseLogSchema.statics.getRecent = function (limit = 50) {
  return this.find().sort({ createdAt: -1 }).limit(limit).lean();
};

/**
 * Get failure logs with pagination
 */
csatResponseLogSchema.statics.getFailures = function (options = {}) {
  const { page = 1, limit = 50, failedAtStep, from, to } = options;
  const filter = { status: 'failure' };

  if (failedAtStep) filter.failedAtStep = failedAtStep;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  return this.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
};

/**
 * Get logs by phone number
 */
csatResponseLogSchema.statics.getByPhone = function (phone) {
  return this.find({ clientPhone: { $regex: phone, $options: 'i' } })
    .sort({ createdAt: -1 })
    .lean();
};

const CSATResponseLog = mongoose.model(
  'CSATResponseLog',
  csatResponseLogSchema
);

export default CSATResponseLog;
