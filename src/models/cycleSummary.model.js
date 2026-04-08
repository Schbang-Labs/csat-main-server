import mongoose from 'mongoose';

const cycleSummarySchema = new mongoose.Schema(
  {
    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cycle',
      required: true,
    },
    cycleInfo: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    executiveSummary: {
      type: String,
      required: true,
      trim: true,
    },
    recommendations: {
      type: [String],
      default: [],
    },
    brandsNeedingAttention: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    brandAggregation: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    accessScope: {
      role: {
        type: String,
        default: null,
      },
      scopedSbuIds: {
        type: [String],
        default: [],
      },
      allDepartmentIds: {
        type: [String],
        default: [],
      },
    },
    generationMode: {
      type: String,
      enum: ['stream', 'sync'],
      required: true,
    },
    generatedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      email: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true,
    collection: 'cycle_summaries',
  }
);

cycleSummarySchema.index({ cycleId: 1 });
cycleSummarySchema.index({ createdAt: -1 });
cycleSummarySchema.index({ 'accessScope.scopedSbuIds': 1 });

const CycleSummary = mongoose.model('CycleSummary', cycleSummarySchema);

export default CycleSummary;
