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
      trim: true,
      // Note: name is not unique since different departments can have same SBU name
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
    // Executive VP for this SBU
    executiveVP: {
      type: String,
      trim: true,
    },
    // Single Associate VP (for SBUs with one associate VP)
    associateVP: {
      type: String,
      trim: true,
    },
    // Array of Associate VPs (for departments with multiple AVPs)
    associateVPs: [
      {
        type: String,
        trim: true,
      },
    ],
    // Creative Director for this SBU (primarily for Solutions)
    creativeDirector: {
      type: String,
      trim: true,
    },
    // Array of lead names for combined PODs (backward compatibility)
    leadNames: [
      {
        type: String,
        trim: true,
      },
    ],
    // Array of brand references associated with this SBU
    brands: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
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

// Indexes
sbuSchema.index({ departmentId: 1 });
sbuSchema.index({ name: 'text' });
sbuSchema.index({ name: 1, departmentId: 1 }); // Compound index for name + department

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
  return this.find({ departmentId, isActive: true }).populate(
    'brands',
    'name slug'
  );
};

/**
 * Static: Get SBU by slug
 * @param {string} slug
 * @returns {Promise<Document>}
 */
sbuSchema.statics.getBySlug = async function (slug) {
  return this.findOne({ slug: slug.toLowerCase() }).populate(
    'brands',
    'name slug'
  );
};

/**
 * Static: Get all active SBUs
 * @returns {Promise<Array>}
 */
sbuSchema.statics.getActive = async function () {
  return this.find({ isActive: true })
    .populate('departmentId', 'name code')
    .populate('brands', 'name slug');
};

/**
 * Static: Get SBU with all brand details
 * @param {ObjectId} sbuId
 * @returns {Promise<Document>}
 */
sbuSchema.statics.getWithBrands = async function (sbuId) {
  return this.findById(sbuId)
    .populate('departmentId', 'name code')
    .populate('brands', 'name slug secondBrainId services');
};

const SBU = mongoose.model('SBU', sbuSchema);

export default SBU;
