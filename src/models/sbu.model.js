import mongoose from 'mongoose';

/**
 * SBU (Strategic Business Unit) / POD Model
 * Stores SBU/POD definitions - POD and SBU are equivalent terms
 * All departments can have SBUs assigned
 */
const sbuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    // Array of lead names for combined PODs (e.g., ["Dhruv", "Malka"])
    leadNames: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'sbus',
  }
);

// Indexes - name and slug already unique via schema
sbuSchema.index({ departmentId: 1 });
sbuSchema.index({ name: 'text' });

// Pre-save middleware to auto-generate slug from name
sbuSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.isModified('slug')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

/**
 * Static: Get all SBUs by department
 * @param {ObjectId} departmentId
 * @returns {Promise<Array>}
 */
sbuSchema.statics.getByDepartment = async function (departmentId) {
  return this.find({ departmentId, isActive: true });
};

/**
 * Static: Get SBU by slug
 * @param {string} slug
 * @returns {Promise<Document>}
 */
sbuSchema.statics.getBySlug = async function (slug) {
  return this.findOne({ slug: slug.toLowerCase() });
};

/**
 * Static: Get all active SBUs
 * @returns {Promise<Array>}
 */
sbuSchema.statics.getActive = async function () {
  return this.find({ isActive: true }).populate('departmentId', 'name code');
};

const SBU = mongoose.model('SBU', sbuSchema);

export default SBU;
