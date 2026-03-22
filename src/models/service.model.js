import mongoose from 'mongoose';

export const normalizeServiceName = name =>
  String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const hasMongoSafeKeyChars = value => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('$')) return false;
  if (trimmed.includes('.')) return false;
  if (trimmed.includes('\0')) return false;
  return true;
};

/**
 * Service Model
 * Master data entity for department-level services/subservices.
 */
const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: hasMongoSafeKeyChars,
        message:
          'Service name cannot start with "$" or include "." / null characters',
      },
    },
    normalizedName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'services',
  }
);

serviceSchema.index({ departmentId: 1, normalizedName: 1 }, { unique: true });
serviceSchema.index({ departmentId: 1, isActive: 1 });

serviceSchema.pre('validate', function (next) {
  this.normalizedName = normalizeServiceName(this.name);
  next();
});

serviceSchema.statics.findByDepartmentAndName = async function (
  departmentId,
  name,
  options = {}
) {
  const { activeOnly = true } = options;
  const normalizedName = normalizeServiceName(name);

  const query = {
    departmentId,
    normalizedName,
  };

  if (activeOnly) {
    query.isActive = true;
  }

  return this.findOne(query);
};

const Service = mongoose.model('Service', serviceSchema);

export default Service;
