import mongoose from 'mongoose';

/**
 * Client History Model
 * Stores historical snapshots of client POC and service mappings per cycle
 * Created automatically when client data changes or new cycle starts
 */
const clientHistorySchema = new mongoose.Schema(
  {
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
    // Brand this POC was associated with
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    // POC details at time of snapshot
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    // Service/Department mappings at time of snapshot
    serviceMapping: [
      {
        department: {
          type: String,
          required: true,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    // Metadata
    snapshotReason: {
      type: String,
      enum: ['cycle_start', 'client_change', 'service_change', 'manual'],
      default: 'client_change',
    },
  },
  {
    timestamps: true,
    collection: 'client_history',
  }
);

// Indexes for efficient queries
clientHistorySchema.index({ clientId: 1, cycleId: 1 }, { unique: true });
clientHistorySchema.index({ brandId: 1, cycleId: 1 });
clientHistorySchema.index({ cycleId: 1 });
clientHistorySchema.index({ 'serviceMapping.department': 1 });

/**
 * Static: Get client data at a specific cycle
 */
clientHistorySchema.statics.getByCycle = async function (clientId, cycleId) {
  return this.findOne({ clientId, cycleId }).populate('brandId', 'name slug');
};

/**
 * Static: Get all POCs for a brand at a specific cycle
 */
clientHistorySchema.statics.getByBrandAndCycle = async function (
  brandId,
  cycleId
) {
  return this.find({ brandId, cycleId });
};

/**
 * Static: Get all history for a client
 */
clientHistorySchema.statics.getHistory = async function (clientId) {
  return this.find({ clientId })
    .sort({ createdAt: -1 })
    .populate('cycleId', 'name cycleNumber year');
};

/**
 * Static: Get all client snapshots for a cycle
 */
clientHistorySchema.statics.getAllForCycle = async function (cycleId) {
  return this.find({ cycleId })
    .populate('clientId', 'name phone')
    .populate('brandId', 'name slug');
};

/**
 * Static: Create or update snapshot for a client at a cycle
 */
clientHistorySchema.statics.upsertSnapshot = async function (
  clientId,
  cycleId,
  data,
  reason = 'client_change'
) {
  return this.findOneAndUpdate(
    { clientId, cycleId },
    {
      ...data,
      clientId,
      cycleId,
      snapshotReason: reason,
    },
    { upsert: true, new: true }
  );
};

const ClientHistory = mongoose.model('ClientHistory', clientHistorySchema);

export default ClientHistory;
