import mongoose from 'mongoose';

/**
 * SBU History Model
 * Stores historical snapshots of SBU leadership for each cycle
 * Created automatically when SBU leadership changes or new cycle starts
 */
const sbuHistorySchema = new mongoose.Schema(
  {
    sbuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SBU',
      required: true,
    },
    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cycle',
      required: true,
    },
    // Leadership snapshot
    executiveVP: {
      type: String,
      trim: true,
    },
    associateVP: {
      type: String,
      trim: true,
    },
    associateVPs: [
      {
        type: String,
        trim: true,
      },
    ],
    creativeDirector: {
      type: String,
      trim: true,
    },
    leadNames: [
      {
        type: String,
        trim: true,
      },
    ],
    // Department at time of snapshot
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    // Brands assigned at time of snapshot
    brands: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
      },
    ],
    // Metadata
    snapshotReason: {
      type: String,
      enum: ['cycle_start', 'leadership_change', 'manual', 'cycle_seed'],
      default: 'leadership_change',
    },
  },
  {
    timestamps: true,
    collection: 'sbu_history',
  }
);

// Indexes for efficient queries
sbuHistorySchema.index({ sbuId: 1, cycleId: 1 }, { unique: true });
sbuHistorySchema.index({ cycleId: 1 });
sbuHistorySchema.index({ sbuId: 1, createdAt: -1 });

/**
 * Static: Get leadership for an SBU at a specific cycle
 */
sbuHistorySchema.statics.getByCycle = async function (sbuId, cycleId) {
  return this.findOne({ sbuId, cycleId })
    .populate('departmentId', 'name displayName')
    .populate('brands', 'name slug');
};

/**
 * Static: Get all history for an SBU
 */
sbuHistorySchema.statics.getHistory = async function (sbuId) {
  return this.find({ sbuId })
    .sort({ createdAt: -1 })
    .populate('cycleId', 'name cycleNumber year');
};

/**
 * Static: Get all SBU snapshots for a cycle
 */
sbuHistorySchema.statics.getAllForCycle = async function (cycleId) {
  return this.find({ cycleId })
    .populate('sbuId', 'name slug')
    .populate('departmentId', 'name displayName');
};

/**
 * Static: Create or update snapshot for an SBU at a cycle
 */
sbuHistorySchema.statics.upsertSnapshot = async function (
  sbuId,
  cycleId,
  data,
  reason = 'leadership_change'
) {
  return this.findOneAndUpdate(
    { sbuId, cycleId },
    {
      ...data,
      sbuId,
      cycleId,
      snapshotReason: reason,
    },
    { upsert: true, new: true }
  );
};

const SBUHistory = mongoose.model('SBUHistory', sbuHistorySchema);

export default SBUHistory;
