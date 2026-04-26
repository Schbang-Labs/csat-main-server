import mongoose from 'mongoose';

/**
 * Cycle Model
 * Stores CSAT cycle definitions - 6 cycles per year from May to December
 */
const cycleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    cycleNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    year: {
      type: Number,
      required: true,
    },
    // Cycle date range
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    // Cycle status
    status: {
      type: String,
      enum: ['upcoming', 'active', 'closed', 'completed'],
      default: 'upcoming',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Track if the cycle has been finalized (history snapshots created)
    isFinalized: {
      type: Boolean,
      default: false,
    },
    finalizedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'cycles',
  }
);

// Indexes
// Compound unique: one cycle per number per year
cycleSchema.index({ year: 1, cycleNumber: 1 }, { unique: true });
cycleSchema.index({ status: 1 });
cycleSchema.index({ startDate: 1, endDate: 1 });

/**
 * Static: Get current active cycle
 * @returns {Promise<Document>}
 */
cycleSchema.statics.getCurrentCycle = async function () {
  return this.findOne({ status: 'active', isActive: true });
};

/**
 * Static: Get cycles by year
 * @param {number} year
 * @returns {Promise<Array>}
 */
cycleSchema.statics.getByYear = async function (year) {
  return this.find({ year, isActive: true }).sort({ cycleNumber: 1 });
};

/**
 * Static: Get cycle by year and number
 * @param {number} year
 * @param {number} cycleNumber
 * @returns {Promise<Document>}
 */
cycleSchema.statics.getByCycleNumber = async function (year, cycleNumber) {
  return this.findOne({ year, cycleNumber });
};

/**
 * Static: Get latest cycle
 * @returns {Promise<Document>}
 */
cycleSchema.statics.getLatest = async function () {
  return this.findOne({ isActive: true }).sort({ year: -1, cycleNumber: -1 });
};

/**
 * Static: Update cycle status
 * @param {ObjectId} cycleId
 * @param {string} status
 * @returns {Promise<Document>}
 */
cycleSchema.statics.updateStatus = async function (cycleId, status) {
  return this.findByIdAndUpdate(cycleId, { status }, { new: true });
};

/**
 * Static: Create cycles for a year
 * @param {number} year
 * @returns {Promise<Array>}
 */
cycleSchema.statics.createYearCycles = async function (year) {
  const cycleConfig = [
    { cycleNumber: 1, name: 'Cycle 1', months: [4] }, // May (0-indexed: 4)
    { cycleNumber: 2, name: 'Cycle 2', months: [5, 6] }, // June-July
    { cycleNumber: 3, name: 'Cycle 3', months: [7] }, // August
    { cycleNumber: 4, name: 'Cycle 4', months: [8, 9] }, // September-October
    { cycleNumber: 5, name: 'Cycle 5', months: [10] }, // November
    { cycleNumber: 6, name: 'Cycle 6', months: [11] }, // December
  ];

  const cycles = cycleConfig.map(config => ({
    name: config.name,
    cycleNumber: config.cycleNumber,
    year,
    startDate: new Date(year, config.months[0], 1),
    endDate: new Date(
      year,
      config.months[config.months.length - 1] + 1,
      0,
      23,
      59,
      59,
      999
    ),
    status: 'upcoming',
    isActive: true,
  }));

  return this.insertMany(cycles, { ordered: false }).catch(err => {
    // Handle duplicate key errors gracefully
    if (err.code === 11000) {
      return this.find({ year });
    }
    throw err;
  });
};

const Cycle = mongoose.model('Cycle', cycleSchema);

export default Cycle;
