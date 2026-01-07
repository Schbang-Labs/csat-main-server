import mongoose from 'mongoose';

/**
 * Valid Departments
 */
export const VALID_DEPARTMENTS = [
  'solutions',
  'media',
  'tech',
  'seo',
  'martech',
  'fluence',
  'smp',
];

/**
 * Brand Model
 * Stores brand/client information with service mappings and ownership details
 */
const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Second Brain integration
    secondBrainId: {
      type: Number,
      default: null,
      index: true,
      sparse: true,
    },
    // Department-Service Mapping (which departments this brand uses)
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
        startDate: {
          type: Date,
          default: Date.now,
        },
        endDate: {
          type: Date,
          default: null, // null = ongoing
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'brands',
  }
);

// Indexes
brandSchema.index({ name: 1 });
brandSchema.index({ slug: 1 }, { unique: true });
brandSchema.index({ 'services.department': 1 });
brandSchema.index({ 'services.sbuId': 1 });

// Pre-save middleware to auto-generate slug from name
brandSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.isModified('slug')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

/**
 * Static: Get all brands by department
 * @param {string} department
 * @returns {Promise<Array>}
 */
brandSchema.statics.getByDepartment = async function (department) {
  return this.find({
    'services.department': department,
    'services.isActive': true,
    isActive: true,
  });
};

/**
 * Static: Get all brands by SBU
 * @param {ObjectId} sbuId
 * @returns {Promise<Array>}
 */
brandSchema.statics.getBySBU = async function (sbuId) {
  return this.find({
    'services.sbuId': sbuId,
    'services.isActive': true,
    isActive: true,
  });
};

/**
 * Static: Get brand by slug
 * @param {string} slug
 * @returns {Promise<Document>}
 */
brandSchema.statics.getBySlug = async function (slug) {
  return this.findOne({ slug: slug.toLowerCase() });
};

/**
 * Static: Get all active brands
 * @returns {Promise<Array>}
 */
brandSchema.statics.getActive = async function () {
  return this.find({ isActive: true });
};

/**
 * Static: Get brands with Second Brain integration
 * @returns {Promise<Array>}
 */
brandSchema.statics.getWithSecondBrain = async function () {
  return this.find({ secondBrainId: { $ne: null }, isActive: true });
};

const Brand = mongoose.model('Brand', brandSchema);

export default Brand;
