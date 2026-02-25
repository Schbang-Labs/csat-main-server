import mongoose from 'mongoose';
import { VALID_DEPARTMENTS } from './brand.model.js';

/**
 * Brand History Model
 * Stores historical snapshots of brand service mappings and POC assignments per cycle
 * Created automatically when brand data changes or new cycle starts
 */
const brandHistorySchema = new mongoose.Schema(
  {
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cycle',
      required: true,
    },
    // Brand details at time of snapshot
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
    },
    secondBrainId: {
      type: Number,
      default: null,
    },
    // Service/Department mappings at time of snapshot
    services: [
      {
        department: {
          type: String,
          enum: VALID_DEPARTMENTS,
          required: true,
        },
        sbuId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'SBU',
          default: null,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    // POC client IDs at time of snapshot
    pocs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
      },
    ],
    // Metadata
    snapshotReason: {
      type: String,
      enum: ['cycle_start', 'service_change', 'poc_change', 'manual'],
      default: 'service_change',
    },
  },
  {
    timestamps: true,
    collection: 'brand_history',
  }
);

// Indexes for efficient queries
brandHistorySchema.index({ brandId: 1, cycleId: 1 }, { unique: true });
brandHistorySchema.index({ cycleId: 1 });
brandHistorySchema.index({ 'services.department': 1 });
brandHistorySchema.index({ 'services.sbuId': 1 });

/**
 * Static: Get brand data at a specific cycle
 */
brandHistorySchema.statics.getByCycle = async function (brandId, cycleId) {
  return this.findOne({ brandId, cycleId })
    .populate('services.sbuId', 'name slug')
    .populate('pocs', 'name phone email');
};

/**
 * Static: Get all history for a brand
 */
brandHistorySchema.statics.getHistory = async function (brandId) {
  return this.find({ brandId })
    .sort({ createdAt: -1 })
    .populate('cycleId', 'name cycleNumber year');
};

/**
 * Static: Get all brand snapshots for a cycle
 */
brandHistorySchema.statics.getAllForCycle = async function (cycleId) {
  return this.find({ cycleId })
    .populate('brandId', 'name slug')
    .populate('services.sbuId', 'name slug');
};

/**
 * Static: Get brands by SBU at a specific cycle
 */
brandHistorySchema.statics.getBySbuAndCycle = async function (sbuId, cycleId) {
  return this.find({
    cycleId,
    'services.sbuId': sbuId,
    'services.isActive': true,
  }).populate('brandId', 'name slug');
};

/**
 * Static: Create or update snapshot for a brand at a cycle
 */
brandHistorySchema.statics.upsertSnapshot = async function (
  brandId,
  cycleId,
  data,
  reason = 'service_change'
) {
  return this.findOneAndUpdate(
    { brandId, cycleId },
    {
      ...data,
      brandId,
      cycleId,
      snapshotReason: reason,
    },
    { upsert: true, new: true }
  );
};

const BrandHistory = mongoose.model('BrandHistory', brandHistorySchema);

export default BrandHistory;
